import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex gap-0.5">
            <div className="w-2 h-2 rounded-sm bg-accent-blue"></div>
            <div className="w-2 h-2 rounded-sm bg-accent-green"></div>
            <div className="w-2 h-2 rounded-sm bg-accent-yellow"></div>
          </div>
          <h1 className="text-2xl font-bold text-white">GroundGame Master</h1>
        </div>
        <p className="text-muted-foreground mb-8">Create your account</p>
        <SignUp afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}
