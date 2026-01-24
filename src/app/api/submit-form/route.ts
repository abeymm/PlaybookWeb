import { NextRequest, NextResponse } from "next/server";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import outputs from "../../../../amplify_outputs.json";

// Configure Amplify for server-side
Amplify.configure(outputs, { ssr: true });

interface FormSubmissionRequest {
  formType: string;
  subject: string;
  email: string;
  formData: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: FormSubmissionRequest = await request.json();

    // Validate required fields
    if (!body.formType || !body.subject || !body.email || !body.formData) {
      return NextResponse.json(
        { error: "Missing required fields: formType, subject, email, formData" },
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
        formType: body.formType,
        subject: body.subject,
        formData: JSON.stringify(body.formData),
        replyToEmail: body.email,
      },
    });

    console.log(`Form submitted (${body.formType}) via GraphQL:`, result);

    return NextResponse.json(
      { success: true, message: "Form submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing form submission:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
