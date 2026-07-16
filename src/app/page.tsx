export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2">
          PSU Grab 🛵
        </h1>
        <p className="text-gray-500 mb-8">
          บริการส่งอาหารและเรียกรถสำหรับชาว ม.อ.
        </p>
        
        <div className="space-y-4">
          <button className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition">
            สั่งอาหารเลย
          </button>
          <button className="w-full bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition">
            เรียกรถรับ-ส่ง
          </button>
        </div>
      </div>
    </main>
  );
}