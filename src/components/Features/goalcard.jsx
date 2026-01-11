import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruckMedical,
  faShield,
  faCreditCard,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
export default function GoalCard() {
  return (
    <>
      <h1 className="text-center text-3xl font-extrabold text-indigo-500 pt-3">Goal Cards</h1>
      <h2 className="text-center text-sm text-gray-900 pb-2">Effective pain relief and fever reducer</h2>
      <div className="container px-6 py-4 mx-auto">
        <div className="grid gap-6 mb-8 lg:grid-cols-4 md:grid-cols-2">
          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faTruckMedical}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Transportation
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                Service For Wedding
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faCreditCard}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Payment
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                Any kind of Online Payment
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faShield}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Safety
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                100% support for health
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faHandHoldingHeart}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Hand-holding-heart
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                The warmth of the heart
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faHandHoldingHeart}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Hand-holding-heart
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                The warmth of the heart
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faShield}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Safety
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                100% support for health
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faCreditCard}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Payment
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                Any kind of Online Payment
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow flex items-center hover:scale-103 p-4">
            <FontAwesomeIcon
              icon={faTruckMedical}
              className="bg-blue-600 text-white rounded-full p-3 mr-4"
            />
            <div>
              <span className="block text-gray-900 text-sm font-bold mb-3">
                Transportation
              </span>
              <span className="block text-gray-900 text-sm font-normal">
                Service For Wedding
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
