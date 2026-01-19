import { NextRequest, NextResponse } from "next/server";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import outputs from "../../../../amplify_outputs.json";

// Configure Amplify for server-side
Amplify.configure(outputs, { ssr: true });

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

    // Create the form data object
    const formData = {
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      tournamentName: body.tournamentName,
      courseName: body.courseName,
      eventDate: body.eventDate || "",
      playerCount: body.playerCount || "",
      interests: body.interests || [],
      notes: body.notes || "",
    };

    // Call the GraphQL mutation via AppSync
    const client = generateClient({ authMode: "iam" });

    const mutation = /* GraphQL */ `
      mutation SubmitForm(
        $formType: String!
        $subject: String
        $formData: AWSJSON!
        $replyToEmail: AWSEmail
      ) {
        submitForm(
          formType: $formType
          subject: $subject
          formData: $formData
          replyToEmail: $replyToEmail
        )
      }
    `;

    const result = await client.graphql({
      query: mutation,
      variables: {
        formType: "tournament-lead",
        subject: `New Tournament Lead: ${body.tournamentName} at ${body.courseName}`,
        formData: JSON.stringify(formData),
        replyToEmail: body.email,
      },
    });

    console.log("Tournament lead submitted via GraphQL:", result);

    return NextResponse.json(
      { success: true, message: "Lead received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing tournament lead:", error);

    // Check if it's a GraphQL error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
