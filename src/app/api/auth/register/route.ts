import { NextRequest } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { handleApiError, createSuccessResponse, createErrorResponse } from '@/lib/api-helpers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const address = formData.get('address') as string;
    const roleName = formData.get('role') as 'customer' | 'provider';

    // 1. Validasi data teks menggunakan Zod
    const validatedData = registerSchema.parse({ fullName, email, password, phoneNumber, address, role: roleName });

    // 2. Periksa apakah email atau nomor telepon sudah ada
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: validatedData.email }, { phoneNumber: validatedData.phoneNumber }] }
    });
    if (existingUser) {
      return createErrorResponse('Email atau nomor telepon sudah terdaftar.', 409);
    }

    // 3. Dapatkan roleId dari database berdasarkan roleName
    const role = await prisma.role.findUnique({ where: { roleName } });
    if (!role) {
      return createErrorResponse('Peran pengguna tidak valid.', 400);
    }

    // 4. Hash password menggunakan bcryptjs
    const passwordHash = await bcryptjs.hash(validatedData.password, 12);

    // Gunakan transaksi untuk memastikan semua data berhasil dibuat
    const newUser = await prisma.$transaction(async (tx) => {
      // 5. Buat pengguna baru
      const createdUser = await tx.user.create({
        data: {
          fullName: validatedData.fullName,
          email: validatedData.email,
          passwordHash,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          roleId: role.id,
          // Provider baru non-aktif sampai diverifikasi, customer langsung aktif
          isActive: roleName === 'customer',
          verificationStatus: roleName === 'provider' ? 'PENDING' : undefined
        },
        include: { role: true }
      });

      // 6. Jika pendaftar adalah provider, proses upload dokumen
      if (roleName === 'provider') {
        const ktpDocument = formData.get('ktpDocument') as File | null;
        const certificateDocument = formData.get('certificateDocument') as File | null;

        if (!ktpDocument || !certificateDocument) {
          throw new Error('Dokumen KTP dan Sertifikat wajib untuk provider.');
        }

        const documentsToCreate = [];
        const files = [
          { file: ktpDocument, type: 'KTP' },
          { file: certificateDocument, type: 'SERTIFIKAT_PELATIHAN' }
        ];

        for (const { file, type } of files) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Buat nama file unik (konsisten dengan API upload lain)
          const fileExtension = path.extname(file.name);
          const uniqueFilename = `${uuidv4()}${fileExtension}`;
          
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
          if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
          
          await writeFile(path.join(uploadDir, uniqueFilename), buffer);
          
          const filePath = `/uploads/documents/${uniqueFilename}`;

          documentsToCreate.push({
            providerId: createdUser.id,
            documentType: type as 'KTP' | 'SERTIFIKAT_PELATIHAN',
            documentName: file.name,
            fileUrl: filePath,
          });
        }
        
        // Simpan data dokumen ke database
        await tx.providerDocument.createMany({
          data: documentsToCreate,
        });
      }

      return createdUser;
    });

    // Hapus password hash dari respons
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return createSuccessResponse(userWithoutPassword, 'Registrasi berhasil. Silakan login.');

  } catch (error) {
    return handleApiError(error);
  }
}

