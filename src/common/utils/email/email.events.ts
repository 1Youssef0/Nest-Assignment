import { EventEmitter } from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { OtpEnum } from "src/common/enums";


export interface IEmail extends Mail.Options {
  otp:string
}


export const emailEvent = new EventEmitter();

emailEvent.on(OtpEnum.ConfirmEmail, async (data: Mail.Options) => {
  try {
    data.subject = OtpEnum.ConfirmEmail;
    await sendEmail(data);
  } catch (error) {
    console.log("failed to send Email", error);
  }
});


emailEvent.on(OtpEnum.ResetPassword, async (data: Mail.Options) => {
  try {
    data.subject = OtpEnum.ResetPassword;
    await sendEmail(data);
  } catch (error) {
    console.log("failed to send Email", error);
  }
});
