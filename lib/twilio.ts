import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER!;

export async function sendSMS(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: TWILIO_FROM,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return { success: false, error };
  }
}
