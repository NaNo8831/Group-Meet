import { Resend } from "resend";
import { formatSlot } from "./format";
import type { Meeting, TeamMember, TimeSlot } from "./types";

const fromAddress = "Group Meet <onboarding@resend.dev>";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured. Email was not sent.");
    return null;
  }

  return new Resend(apiKey);
}

async function sendEmail(input: { to: string | string[]; subject: string; text: string }) {
  const resend = getResend();

  if (!resend) {
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      ...input
    });

    if (error) {
      console.error("Resend email failed", error);
    }
  } catch (error) {
    console.error("Resend email failed", error);
  }
}

export async function sendTeamNotificationEmail(input: {
  meeting: Meeting;
  slots: TimeSlot[];
  member: TeamMember;
  appOrigin: string;
}) {
  const votingLink = `${input.appOrigin}/team/meetings/${input.meeting.id}?member=${input.member.id}`;
  const slotList = input.slots.map((slot) => `- ${formatSlot(slot)}`).join("\n");

  await sendEmail({
    to: input.member.email,
    subject: `New meeting request from ${input.meeting.participant_name}`,
    text: `${input.meeting.participant_name} has requested a meeting.

Topic: ${input.meeting.topic}

Proposed times:
${slotList}

Select your availability:
${votingLink}`
  });
}

export async function sendParticipantConfirmationEmail(input: {
  meeting: Meeting;
  slot: TimeSlot;
  leader: TeamMember;
  support: TeamMember;
}) {
  await sendEmail({
    to: input.meeting.participant_email,
    subject: `Your meeting is confirmed - ${formatSlot(input.slot)}`,
    text: `Your meeting has been confirmed.

Date & Time: ${formatSlot(input.slot)}
You will meet with: ${input.leader.name} and ${input.support.name}`
  });
}

export async function sendTeamConfirmationEmail(input: {
  meeting: Meeting;
  slot: TimeSlot;
  leader: TeamMember;
  support: TeamMember;
}) {
  await sendEmail({
    to: [input.leader.email, input.support.email],
    subject: `Meeting confirmed with ${input.meeting.participant_name} - ${formatSlot(input.slot)}`,
    text: `Participant: ${input.meeting.participant_name} (${input.meeting.participant_email})
Topic: ${input.meeting.topic}
Date & Time: ${formatSlot(input.slot)}`
  });
}
