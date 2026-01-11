import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faUsers,
  faComment,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

export default function Banner() {
  return (
    <>
      <div className="container bg-gray-200">
        <h1 className="text-center text-3xl font-extrabold text-indigo-500 pt-3">
          Target
        </h1>
        <h2 className="text-center text-sm text-indigo-900 pb-2">
          Effective pain relief and fever reducer
        </h2>
        <div className="container flex grid lg:gap-20 md:gap-2 lg:grid-cols-4 md:grid-cols-2 lg:px-32 md:px-12">
          <div className="flex border rounded-lg shadow-xl space-x-4 space-y-2 p-2 mr-12 mb-6 mt-4">
            <div className="flex text-black-100">
              <FontAwesomeIcon
                icon={faHeart}
                className="w-full pt-8 py-6"
              />
            </div>
            <div className=" text-xl font-bold">
              <div>Total views</div>
              <div>310K</div>
              <div>Jan 1st - Feb 1st</div>
            </div>
          </div>

          <div className="flex border rounded-lg shadow-xl space-x-4 space-y-2 p-2 mr-12 mb-6 mt-4">
            <div className="flex text-black-100">
              <FontAwesomeIcon
                icon={faUsers}
                className="w-full pt-8 py-6"
              />
            </div>
            <div className="text-xl font-bold">
              <div>Total Users</div>
              <div>42K</div>
              <div>Jan 1st - Feb 1st</div>
            </div>
          </div>

          <div className="flex border rounded-lg shadow-xl space-x-4 space-y-2 p-2 mr-12 mb-6 mt-4">
            <div className="flex text-black-100">
              <FontAwesomeIcon
                icon={faComment}
                className="w-full pt-8 py-6"
              />
            </div>
            <div className="text-xl font-bold">
              <div>Total Reviews</div>
              <div>12K</div>
              <div>Jan 1st - Feb 1st</div>
            </div>
          </div>

          <div className="flex border rounded-lg shadow-xl space-x-4 space-y-2 p-2 mr-12 mb-6 mt-4">
            <div className="flex text-black-100">
              <FontAwesomeIcon
                icon={faStar}
                className="w-full pt-8 py-6"
              />
            </div>
            <div className="text-xl font-bold">
              <div>Total Rating</div>
              <div>85%</div>
              <div>Jan 1st - Feb 1st</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
