import { motion } from "framer-motion";

interface Props {
  orderId: number | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ orderId, onClose }: Props) {
  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl p-8 text-center max-w-md w-full">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-green-500 text-6xl mb-4"
        >
          ✓
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">
          Order Placed Successfully
        </h2>

        <p className="mb-4">
          Order ID: <b>{orderId}</b>
        </p>

        <p className="text-sm text-gray-600 mb-6">
          A confirmation email has been sent to you.
        </p>

        <button
          onClick={onClose}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Close
        </button>

      </div>
    </div>
  );
}