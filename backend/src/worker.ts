import { Worker } from 'bullmq';
import Redis from './config/redis';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import logger from './config/logger'; // Assuming you have a logger configured
import sgMail from '@sendgrid/mail';
import * as Sentry from '@sentry/node';
 
// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const worker = new Worker(
  'imageProcessing',
  async (job) => {
    const { userId, fileBuffer } = job.data;

    logger.info(`Processing image job for user: ${userId}`);

    try {
      // Resize image
      const resizedImageBuffer = await sharp(fileBuffer)
        .resize(200, 200)
        .toFormat('jpeg')
        .toBuffer();

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME || '',
        Key: `${userId}.jpeg`, // Use user ID as key
        Body: resizedImageBuffer,
        ContentType: 'image/jpeg',
      };

      const uploadResult = await s3.upload(uploadParams).promise();

      // Update user's profile_picture_url in the database
      // (You would need to import your User model and update logic here)
      // Example (assuming you have a User model imported):
      // import User from './models/User';
      // const user = await User.findByPk(userId);
      // if (user) {
      //   await user.update({ profile_picture_url: uploadResult.Location });
      //   logger.info(`Updated profile picture URL for user: ${userId}`);
      // } else {
      //   logger.warn(`User not found for image processing job: ${userId}`);
      // }


      logger.info(`Image processed and uploaded to S3 for user: ${userId}`);
    } catch (error) {
      logger.error(`Error processing image job for user ${userId}:`, error); // Log the error
      if (error instanceof Error) { 
        Sentry.captureException(error); // Report to Sentry
      }
      throw error; // Re-throw to indicate job failure
    }
  },
  { connection: Redis },
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const emailWorker = new Worker(
  'emailSending',
  async (job) => {
    const { recipient, subject, body } = job.data;
    logger.info(`Processing email job to: ${recipient} with subject: ${subject}`);

    try { 
      const msg = {
        from: process.env.SENDGRID_SENDER_EMAIL || 'noreply@your-app.com', // Replace with your verified SendGrid sender email
        subject: subject,
        text: body,
        // html: '<strong>and easy to do anywhere, even with Node.js</strong>', // Optional: HTML version of the body
      };
      await sgMail.send(msg);
      // Example with a placeholder:
      logger.info(`Email sent successfully to ${recipient}`);
    } catch (error) {
      logger.error(`Error sending email to ${recipient}:`, error);
      if (error instanceof Error) {
        Sentry.captureException(error);
      }
      throw error;
    }
  },
  {
    connection: Redis,
  },
);;

worker.on('completed', (job) => {
  logger.info(`Job completed with ID ${job.id}`);
});

worker.on('failed', (job: any, error: Error) => {
  logger.error(`Job failed with ID ${job?.id}:`, error); // Log the full error object
});

emailWorker.on('completed', (job) => {
  logger.info(`Email job completed with ID ${job.id}`);
});

emailWorker.on('failed', (job: any, error: Error) => {
  logger.error(`Email job failed with ID ${job?.id}:`, error);
});

logger.info('🚀 Image processing worker started.'); // Keep existing log
logger.info('✉️ Email sending worker started.'); // Add new log

// You would typically run this worker in a separate process

// Example of how to close the worker gracefully
// process.on('SIGINT', async () => {
//   logger.info('Shutting down worker...');
//   await worker.close();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   logger.info('Shutting down worker...');
//   await worker.close();
//   process.exit(0);
// });

export default worker;