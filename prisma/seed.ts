import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const customerRole = await prisma.role.upsert({
    where: { roleName: 'customer' },
    update: {},
    create: { roleName: 'customer' }
  })

  const providerRole = await prisma.role.upsert({
    where: { roleName: 'provider' },
    update: {},
    create: { roleName: 'provider' }
  })

  const adminRole = await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: { roleName: 'admin' }
  })

  // Create service categories
  const categories = [
    { name: 'Service AC', description: 'Layanan perbaikan dan maintenance AC', iconUrl: '/icons/ac.svg' },
    { name: 'Jasa Kebersihan', description: 'Layanan pembersihan rumah dan kantor', iconUrl: '/icons/cleaning.svg' },
    { name: 'Tukang Bangunan', description: 'Layanan konstruksi dan renovasi', iconUrl: '/icons/construction.svg' },
    { name: 'Elektronik', description: 'Perbaikan perangkat elektronik', iconUrl: '/icons/electronics.svg' },
    { name: 'Plumbing', description: 'Layanan perbaikan saluran air', iconUrl: '/icons/plumbing.svg' },
    { name: 'Tukang Kayu', description: 'Layanan pertukangan kayu', iconUrl: '/icons/carpenter.svg' }
  ]

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ekerjakarawang.com' },
    update: {},
    create: {
      fullName: 'Admin E-Kerja Karawang',
      email: 'admin@ekerjakarawang.com',
      passwordHash: hashedPassword,
      phoneNumber: '081234567890',
      roleId: adminRole.id,
      isActive: true
    }
  })

  // Create sample customer
  const customerPassword = await bcrypt.hash('customer123', 10)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      fullName: 'John Customer',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      phoneNumber: '081234567891',
      address: 'Jl. Contoh No. 123, Jakarta',
      roleId: customerRole.id,
      isActive: true
    }
  })

  // Create sample provider
  const providerPassword = await bcrypt.hash('provider123', 10)
  const provider = await prisma.user.upsert({
    where: { email: 'provider@example.com' },
    update: {},
    create: {
      fullName: 'Ahmad Provider',
      email: 'provider@example.com',
      passwordHash: providerPassword,
      phoneNumber: '081234567892',
      address: 'Jl. Provider No. 456, Karawang',
      roleId: providerRole.id,
      providerBio: 'Teknisi AC berpengalaman 10 tahun dengan sertifikat resmi',
      verificationStatus: 'VERIFIED',
      verifiedBy: admin.id,
      verifiedAt: new Date(),
      isActive: true
    }
  })

  // Create provider services
  const acCategory = await prisma.serviceCategory.findFirst({ where: { name: 'Service AC' } })
  const cleaningCategory = await prisma.serviceCategory.findFirst({ where: { name: 'Jasa Kebersihan' } })

  if (acCategory) {
    await prisma.providerService.upsert({
      where: { providerId_categoryId: { providerId: provider.id, categoryId: acCategory.id } },
      update: {},
      create: {
        providerId: provider.id,
        categoryId: acCategory.id,
        serviceTitle: 'Service AC 1/2 PK - 2 PK',
        description: 'Layanan service AC meliputi pembersihan, pengecekan freon, dan perbaikan ringan',
        price: 150000,
        priceUnit: 'per unit',
        isAvailable: true
      }
    })
  }

  if (cleaningCategory) {
    await prisma.providerService.upsert({
      where: { providerId_categoryId: { providerId: provider.id, categoryId: cleaningCategory.id } },
      update: {},
      create: {
        providerId: provider.id,
        categoryId: cleaningCategory.id,
        serviceTitle: 'Bersih Rumah Tipe 36-45',
        description: 'Layanan pembersihan rumah meliputi lantai, jendela, dan kamar mandi',
        price: 200000,
        priceUnit: 'per rumah',
        isAvailable: true
      }
    })
  }

  // Create sample portfolio
  await prisma.providerPortfolio.create({
    data: {
      providerId: provider.id,
      projectTitle: 'Service AC Rumah Pak Budi',
      description: 'Melakukan service rutin AC split 1 PK, pembersihan filter dan penambahan freon',
      imageUrl: '/images/portfolio1.jpg',
      completedAt: new Date('2024-01-15')
    }
  })

  // Create sample certification
  await prisma.providerCertification.create({
    data: {
      providerId: provider.id,
      certificateName: 'Sertifikat Teknisi AC',
      issuingOrganization: 'Asosiasi Teknisi Indonesia',
      credentialId: 'ATI-2023-001',
      fileUrl: '/certificates/cert1.pdf',
      issuedAt: new Date('2023-06-01')
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
