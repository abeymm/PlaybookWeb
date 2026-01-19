import { NextRequest, NextResponse } from "next/server";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import outputs from "../../../../amplify_outputs.json";

// Configure Amplify for server-side
Amplify.configure(outputs, { ssr: true });

interface CourseLeadRequest {
  name: string;
  email: string;
  phone?: string;
  courseName: string;
  role?: string;
  roundsPerYear?: string;
  interestedIn: string[];
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CourseLeadRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.courseName) {
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
      courseName: body.courseName,
      role: body.role || "",
      roundsPerYear: body.roundsPerYear || "",
      interestedIn: body.interestedIn || [],
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
        formType: "course-lead",
        subject: `New Course Lead: ${body.courseName}`,
        formData: JSON.stringify(formData),
        replyToEmail: body.email,
      },
    });

    console.log("Course lead submitted via GraphQL:", result);

    return NextResponse.json(
      { success: true, message: "Lead received successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing course lead:", error);

    // Check if it's a GraphQL error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
