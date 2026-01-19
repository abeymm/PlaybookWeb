import { NextRequest, NextResponse } from "next/server";

interface TournamentLeadRequest {
  name: string;
  email: string;
  phone?: string;
  tournamentName: string;
  courseName: string;
  eventDate?: string;
  playerCount?: string;
  interests: string[];
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TournamentLeadRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.tournamentName || !body.courseName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const leadData = {
      ...body,
      submittedAt: new Date().toISOString(),
      source: "website",
    };

    // Log the lead (for development/debugging)
    console.log("Tournament Lead Received:", JSON.stringify(leadData, null, 2));

    // TODO: Store in DynamoDB via Amplify Data client
    // TODO: Send email notification via AWS SES

    // For now, we'll use a simple approach - you can integrate with:
    // 1. AWS SES for email notifications
    // 2. DynamoDB for lead storage
    // 3. External services like Mailchimp, HubSpot, etc.

    // Example: If SES is configured, uncomment and use:
    // await sendLeadNotificationEmail(leadData);
    // await storeTournamentLead(leadData);

    return NextResponse.json(
      { success: true, message: "Lead received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing tournament lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Placeholder functions for future implementation
// These can be implemented when AWS services are configured

/*
async function sendLeadNotificationEmail(lead: TournamentLeadRequest & { submittedAt: string }) {
  // Use AWS SES or similar service
  // const ses = new SESClient({ region: process.env.AWS_REGION });
  // await ses.send(new SendEmailCommand({
  //   Source: "noreply@playbook.golf",
  //   Destination: { ToAddresses: ["support@playbook.golf"] },
  //   Message: {
  //     Subject: { Data: `New Tournament Lead: ${lead.tournamentName}` },
  //     Body: { Text: { Data: formatLeadEmail(lead) } }
  //   }
  // }));
}

async function storeTournamentLead(lead: TournamentLeadRequest & { submittedAt: string }) {
  // Use Amplify Data client or direct DynamoDB access
  // const client = generateClient<Schema>();
  // await client.models.TournamentLead.create(lead);
}
*/
