import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">GroundGame Master</h1>
        <p className="text-gray-600 mb-8">Create your account</p>
        <SignUp afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}
