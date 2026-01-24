import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <main className="flex flex-col items-center gap-8 max-w-md text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Joe
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your training, executed.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs mt-4">
          <Link
            href="/onboard"
            className="w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-center"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-12 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            App is running. Session 11 complete. Telegram bot ready.
          </p>
        </div>
      </main>
    </div>
  );
}
