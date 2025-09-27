// Encryption Verification API for Postman Testing
// REQ-B-2.4 and REQ-B-8.2 Database Verification Endpoint

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createSuccessResponse, createErrorResponse, requireAuth } from '@/lib/api-helpers';
import { decryptChatMessage } from '@/lib/utils-backend';

export async function GET(request: NextRequest) {
  console.log("\n--- [ENCRYPTION VERIFY API] Database verification request ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    const { searchParams } = new URL(request.url);
    const verifyType = searchParams.get('type'); // 'files', 'messages', or 'all'
    
    console.log(`[ENCRYPTION VERIFY] User ${userId} requesting verification for: ${verifyType}`);

    const results: any = {
      userId: userId,
      timestamp: new Date().toISOString(),
      verification: {}
    };

    // Verify file encryption (REQ-B-2.4)
    if (verifyType === 'files' || verifyType === 'all') {
      console.log('[ENCRYPTION VERIFY] Checking file encryption...');
      
      const recentDocuments = await prisma.providerDocument.findMany({
        where: { providerId: userId },
        select: {
          id: true,
          documentName: true,
          fileUrl: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }) as any;

      const fileAnalysis = {
        totalDocuments: recentDocuments.length,
        encryptedDocuments: 0,
        legacyDocuments: 0,
        documents: recentDocuments.map((doc: any) => {
          const isEncrypted = doc.originalFileName && 
                             doc.fileUrl !== doc.originalFileName && 
                             doc.encryptionIV && 
                             doc.authTag;
          
          if (isEncrypted) fileAnalysis.encryptedDocuments++;
          else fileAnalysis.legacyDocuments++;

          return {
            documentId: doc.id,
            documentName: doc.documentName,
            fileUrl_RAW_DATABASE: doc.fileUrl, // Show encrypted filename
            originalFileName: doc.originalFileName,
            hasEncryption: {
              iv: !!doc.encryptionIV,
              authTag: !!doc.authTag,
              originalName: !!doc.originalFileName
            },
            encryptionStatus: isEncrypted ? 'ENCRYPTED' : 'LEGACY/UNENCRYPTED',
            createdAt: doc.createdAt
          };
        }),
        encryptionRate: recentDocuments.length > 0 ? 
          Math.round((recentDocuments.filter((d: any) => d.originalFileName && d.encryptionIV).length / recentDocuments.length) * 100) : 0
      };

      results.verification.fileAnalysis = fileAnalysis;
    }

    // Verify message encryption (REQ-B-8.2)
    if (verifyType === 'messages' || verifyType === 'all') {
      console.log('[ENCRYPTION VERIFY] Checking message encryption...');
      
      // Get conversations where user is participant
      const conversations = await prisma.chatParticipant.findMany({
        where: { userId: userId },
        select: { conversationId: true }
      });

      if (conversations.length > 0) {
        const conversationIds = conversations.map(c => c.conversationId);
        
        const recentMessages = await prisma.chatMessage.findMany({
          where: {
            conversationId: { in: conversationIds }
          },
          include: {
            sender: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { sentAt: 'desc' },
          take: 10
        });

        const messageAnalysis = {
          totalMessages: recentMessages.length,
          messagesFromUser: recentMessages.filter(m => m.senderId === userId).length,
          conversations: conversationIds.length,
          messages: recentMessages.map(msg => {
            // Try to decrypt message
            let decryptedContent;
            let isEncrypted = false;
            
            try {
              decryptedContent = decryptChatMessage(msg.messageContent);
              // Check if decryption actually worked (different from original)
              isEncrypted = decryptedContent !== msg.messageContent && 
                          msg.messageContent.includes(':'); // Our encryption format has ':'
            } catch {
              decryptedContent = '[DECRYPTION FAILED]';
              isEncrypted = true; // Assume encrypted if decryption fails
            }

            return {
              messageId: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              senderName: msg.sender.fullName,
              messageContent_RAW_DATABASE: msg.messageContent, // Show encrypted content
              decryptedContent: decryptedContent,
              encryptionStatus: isEncrypted ? 'ENCRYPTED' : 'PLAIN_TEXT',
              sentAt: msg.sentAt,
              isFromCurrentUser: msg.senderId === userId
            };
          })
        };

        results.verification.messageAnalysis = messageAnalysis;
      } else {
        results.verification.messageAnalysis = {
          note: 'No conversations found for this user',
          totalMessages: 0,
          conversations: 0
        };
      }
    }

    // Overall security assessment
    if (verifyType === 'all') {
      const fileEncryptionWorking = results.verification.fileAnalysis?.encryptionRate > 0;
      const messageEncryptionWorking = results.verification.messageAnalysis?.messages?.some((m: any) => m.encryptionStatus === 'ENCRYPTED');
      
      results.verification.overallAssessment = {
        req_b_2_4_file_encryption: fileEncryptionWorking ? 'WORKING' : 'NOT_DETECTED',
        req_b_8_2_message_encryption: messageEncryptionWorking ? 'WORKING' : 'NOT_DETECTED',
        securityLevel: (fileEncryptionWorking && messageEncryptionWorking) ? 'HIGH' : 'MEDIUM',
        recommendations: []
      };

      if (!fileEncryptionWorking) {
        results.verification.overallAssessment.recommendations.push('Upload some files to test file encryption');
      }
      if (!messageEncryptionWorking) {
        results.verification.overallAssessment.recommendations.push('Send some chat messages to test message encryption');
      }
    }

    console.log(`[ENCRYPTION VERIFY] Verification completed for ${verifyType}`);
    
    return createSuccessResponse(results, `Encryption verification completed for ${verifyType}`);

  } catch (error) {
    console.error("❌ [ENCRYPTION VERIFY] Error:", error);
    return createErrorResponse('Encryption verification failed', 500);
  }
}

export async function POST(request: NextRequest) {
  // Test endpoint to create sample data for testing
  console.log("\n--- [ENCRYPTION VERIFY API] Creating test data ---");
  
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) return authResult;
    
    const userId = parseInt(authResult.user.userId as string);
    const body = await request.json();
    const { action, testData } = body;

    if (action === 'create_test_message') {
      // Create a test conversation and message for encryption testing
      console.log('[ENCRYPTION VERIFY] Creating test conversation and message...');
      
      // Find or create a test conversation
      let conversation = await prisma.chatConversation.findFirst({
        where: {
          participants: {
            some: { userId: userId }
          }
        }
      });

      if (!conversation) {
        // Create test conversation
        conversation = await prisma.chatConversation.create({
          data: {
            participants: {
              create: [
                { userId: userId },
                // Add admin user as second participant if exists
                { userId: 1 }
              ]
            }
          }
        });
      }

      // Create test message using the chat messages API internally
      const testMessage = testData?.message || 'Test encryption message with sensitive data: Credit Card 1234-5678-9012-3456';
      
      // Use the same encryption as the chat API
      const { encryptChatMessage } = await import('@/lib/utils-backend');
      const encryptedMessage = encryptChatMessage(testMessage);
      
      const chatMessage = await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          messageContent: encryptedMessage
        }
      });

      return createSuccessResponse({
        action: 'create_test_message',
        conversationId: conversation.id,
        messageId: chatMessage.id,
        originalMessage: testMessage,
        encryptedInDatabase: encryptedMessage,
        note: 'Test message created and encrypted in database'
      }, 'Test message created successfully');
    }

    return createErrorResponse('Invalid action', 400);

  } catch (error) {
    console.error("❌ [ENCRYPTION VERIFY] Error creating test data:", error);
    return createErrorResponse('Failed to create test data', 500);
  }
}