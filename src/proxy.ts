import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isTrainerRoute = createRouteMatcher(["/trainer(.*)"]);

const TRAINER_EMAILS = ["lukemoore9@icloud.com", "tdracos98@gmail.com"];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { sessionClaims, redirectToSignIn } = await auth();

  // Allow public routes for everyone
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to sign-in
  if (!sessionClaims) {
    if (isApiRoute(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  // Allow API routes and onboarding route for authenticated users
  if (isApiRoute(req) || isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // If authenticated but onboarding not complete, redirect to /onboarding
  const metadata = sessionClaims.metadata as
    | { onboardingComplete?: boolean }
    | undefined;
  if (!metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  // Trainer route — check email is in allowed list
  if (isTrainerRoute(req)) {
    const email = (sessionClaims as Record<string, unknown>).email as string | undefined;
    if (email && !TRAINER_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.redirect(new URL("/home", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
