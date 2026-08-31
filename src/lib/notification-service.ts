import { prisma } from './prisma';
import { adminMessaging } from './firebase-admin';

export type NotificationType =
  | 'ANNOUNCEMENT'
  | 'GRADE'
  | 'ATTENDANCE'
  | 'SPP'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'SYSTEM';

export interface SendNotificationPayload {
  userId?: number;
  userIds?: number[];
  title: string;
  body: string;
  type?: NotificationType;
  url?: string;
  imageUrl?: string;
  createdBy?: number;
}

/**
 * Sanitizes and validates deep link URL to prevent open redirects.
 */
function sanitizeUrl(url?: string): string {
  if (!url) return '/';
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  if (
    trimmed.startsWith('https://lmssmaalfurqon.my.id') ||
    trimmed.startsWith('http://localhost:3000')
  ) {
    return trimmed;
  }
  return '/';
}

export const notificationService = {
  /**
   * Send notification to a single user.
   */
  async sendToUser(payload: SendNotificationPayload) {
    if (!payload.userId) return null;
    return this.sendToUsers({
      ...payload,
      userIds: [payload.userId],
    });
  },

  /**
   * Send notification to multiple users.
   */
  async sendToUsers(payload: SendNotificationPayload) {
    const { userIds, title, body, type = 'SYSTEM', url, imageUrl, createdBy } = payload;
    if (!userIds || userIds.length === 0) return null;

    const safeUrl = sanitizeUrl(url);

    // 1. Create Notification record
    const notification = await prisma.notification.create({
      data: {
        title,
        body,
        type,
        url: safeUrl,
        imageUrl: imageUrl || null,
        createdBy: createdBy || null,
      },
    });

    // 2. Create NotificationRecipient records for all targeted users
    const recipientData = userIds.map((userId) => ({
      notificationId: notification.id,
      userId,
      status: 'PENDING',
    }));

    await prisma.notificationRecipient.createMany({
      data: recipientData,
    });

    // 3. Find active FCM tokens for target users
    const devices = await prisma.userDevice.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: {
        id: true,
        fcmToken: true,
        userId: true,
      },
    });

    if (devices.length === 0) {
      return { notification, sentCount: 0, failedCount: 0 };
    }

    // 4. Send via Firebase Admin SDK
    const tokens = devices.map((d) => d.fcmToken);
    const messagePayload = {
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: {
        notificationId: String(notification.id),
        type,
        url: safeUrl,
        click_action: safeUrl,
      },
      tokens,
    };

    let sentCount = 0;
    let failedCount = 0;

    try {
      const response = await adminMessaging.sendEachForMulticast(messagePayload);
      sentCount = response.successCount;
      failedCount = response.failureCount;

      // Handle invalid tokens to deactivate them
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp: any, index: number) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(tokens[index]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await prisma.userDevice.updateMany({
            where: { fcmToken: { in: invalidTokens } },
            data: { isActive: false },
          });
        }
      }

      // Update recipient statuses to SENT
      await prisma.notificationRecipient.updateMany({
        where: {
          notificationId: notification.id,
          userId: { in: userIds },
        },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[NotificationService] Error sending FCM message:', error);
      await prisma.notificationRecipient.updateMany({
        where: {
          notificationId: notification.id,
          userId: { in: userIds },
        },
        data: {
          status: 'FAILED',
        },
      });
    }

    return { notification, sentCount, failedCount };
  },

  /**
   * Mark notification as read for a recipient.
   */
  async markAsRead(notificationId: number, userId: number) {
    return prisma.notificationRecipient.updateMany({
      where: {
        notificationId,
        userId,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: number) {
    return prisma.notificationRecipient.updateMany({
      where: {
        userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  },
};
