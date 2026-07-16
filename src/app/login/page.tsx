import Link from "next/link";

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-600 mb-2">เข้าสู่ระบบ</h1>
                    <p className="text-gray-500">PSU Grab ยินดีต้อนรับ</p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            อีเมล หรือ รหัสนักศึกษา
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                            placeholder="เช่น 6410110xxx"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition"
                    >
                        ล็อกอิน
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ยังไม่มีบัญชีใช่ไหม?{" "}
                        <Link href="#" className="text-blue-600 hover:underline font-medium">
                            สมัครสมาชิก
                        </Link>
                    </p>
                    <div className="mt-4">
                        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition">
                            ← กลับหน้าหลัก
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}