import { ToggleSwitch } from "flowbite-react";
import { useEffect, useState } from "react";
import { FaArrowRight, FaTimes, FaTimesCircle } from "react-icons/fa";
import classNames from "../../../../consts/classNames";
import { useDispatch, useSelector } from "react-redux";
import extra_features from "../../../../data/game/league-of-legends/extra_features.json";

// Import variable
import rank from "../../../../data/game/league-of-legends/rank.json";
import ModalChampionRole from "../../../../components/game/league-of-legends/ModalChampionRole";
import { setChampions, setRoles } from "../../../../redux/slice/game/lolSlice";
import {
  setCheckoutModal,
  setLoginModal,
} from "../../../../redux/slice/globalSlice";

const Checkout = () => {
  const [discount, setDiscount] = useState(false);
  const [applycode, setApplycode] = useState(0);
  const [extraFeatures, setExtraFeatures] = useState<any[]>([]);
  const [isOpenChampionRoleModal, setisOpenChampionRoleModal] = useState(false);
  let timeout: any = null;

  const dispatch = useDispatch();

  const current_rank = useSelector((d: any) => d.lol?.current_rank);
  const desired_rank = useSelector((d: any) => d.lol?.desired_rank);
  const server = useSelector((d: any) => d.lol?.server);

  // Price
  const [price, setPrice] = useState(0);

  useEffect(() => {
    setExtraFeatures(extra_features);
  }, []);

  const handleChange = (event: any) => {
    switch (event.target.name) {
      case "applycode":
        setApplycode(event.target.value);
        break;
      default:
        break;
    }
  };

  const handleApply = () => {
    if (discount) return;
    if (applycode) {
      setDiscount(true);
    }
  };

  const getOriginalPrice = () => {
    if (current_rank?.rank?._id <= desired_rank?.rank?._id) {
      if (current_rank?.rank?._id == desired_rank?.rank?._id) {
        if (current_rank?.division?.value <= desired_rank?.division?.value) {
          return 0;
        } else {
          let price = current_rank.rank.price.rank[
            `${current_rank?.server?.type}`
          ]
            .slice(current_rank.division._id, desired_rank.division._id)
            .reduce((a: any, b: any) => {
              return a + b;
            }, 0);
          return price;
        }
      } else {
        let arr = rank.slice(
          current_rank?.rank?._id,
          desired_rank?.rank?._id + 1
        );
        let price = 0;
        arr.map((d: any) => {
          price += d.price.rank[`${current_rank?.server?.type}`]
            .slice(0, 4)
            .reduce((a: any, b: any) => a + b);
        });
        current_rank?.rank?.price?.rank[`${current_rank?.server?.type}`].map(
          (d: any, index: any) => {
            if (index < current_rank?.division?._id) {
              price -= d;
            }
          }
        );
        desired_rank?.rank?.price?.rank[`${current_rank?.server?.type}`].map(
          (d: any, index: any) => {
            if (index >= desired_rank?.division?._id && index < 4) {
              price -= d;
            }
          }
        );
        return price;
      }
    } else {
      return 0;
    }
  };

  const calcTotalPrice = () => {
    let price = getOriginalPrice();
    if (current_rank?.current_lp) {
      price *= current_rank?.current_lp?.rate;
    }
    if (current_rank?.current_lp_gain) {
      price += price * current_rank?.current_lp_gain?.rate;
    }

    // extra features
    let extra_price = 0;
    extraFeatures.map((d: any) => {
      if (d.apply) {
        extra_price += d.rate * price;
      }
    });

    if (current_rank?.champions?.length) {
      price += price * 0.2;
    }

    price += extra_price;

    if (discount) {
      price -= price * 0.2;
    }

    setPrice(Math.round(price * 100) / 100);
  };

  useEffect(() => {
    calcTotalPrice();
  }, [current_rank, desired_rank, server, extraFeatures, discount]);

  const handleBuyBoost = () => {
    // decide user login or not
    // dispatch(setLoginModal(true));
    dispatch(setCheckoutModal(true));
  };

  return (
    <div className="border border-violet-800 p-4 rounded-lg">
      <div className="text-center mb-2">
        <span className="text-xl">Checkout</span>
        <p className="text-gray-500">Add extra options to your boost.</p>
      </div>
      <div className="border-t border-b border-violet-800 py-4">
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-1">
            {current_rank && (
              <img className="w-6" src={current_rank?.rank?.url} alt="ICO" />
            )}
            {current_rank?.rank?.title || ""} {current_rank?.division?.mark}
          </div>
          <FaArrowRight />
          <div className="flex items-center gap-1">
            {desired_rank && (
              <img className="w-6" src={desired_rank?.rank?.url} alt="ICO" />
            )}
            {desired_rank?.rank?.title || ""} {desired_rank?.division?.mark}
          </div>
        </div>
      </div>
      <div className="space-y-4 py-4">
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <span>Champion&Role</span>
            <span
              className={`${"text-green-500 border-green-500"} border rounded-xl  px-2 text-sm`}
            >
              Free
            </span>
          </div>
          <button
            className={`px-2 py-1 text-xs bg-violet-800 rounded-xl hover:bg-violet-500`}
            onClick={() => setisOpenChampionRoleModal(true)}
          >
            Pick
          </button>
        </div>

        {Array.isArray(extra_features) &&
          extraFeatures?.map((d: any, index: number) => (
            <div
              key={index}
              className="flex justify-between items-center text-gray-300"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{d.title}</span>
                <span
                  className={`${
                    d.rate == 0
                      ? "text-green-500 border-green-500"
                      : "text-violet-500 border-violet-500"
                  } border rounded-xl  px-2 text-sm`}
                >
                  {d.rate == 0 ? "Free" : `${100 * d.rate}%`}
                </span>
              </div>
              <ToggleSwitch
                sizing="sm"
                label=""
                checked={d.apply}
                onChange={() => {
                  let temp = [...extraFeatures];
                  temp[index] = { ...temp[index], apply: !d.apply };
                  setExtraFeatures(temp);
                }}
                color="violet"
                theme={{
                  toggle: {
                    checked: {
                      on: "after:translate-x-full after:border-violet-900 rtl:after:-translate-x-full",
                      off: "border-violet-900 bg-transparent dark:border-violet-600 dark:bg-violet-700",
                    },
                  },
                }}
              />
            </div>
          ))}
      </div>
      <div className="border-t border-b border-violet-800 py-4 flex justify-center items-center gap-2">
        <FaTimesCircle />
        <span className="text-gray-500"> Completion Time: </span>
        <b>~1 day</b>
      </div>
      <div className="py-4">
        {!discount ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="" className="text-sm text-gray-500">
              Discount Code
            </label>
            <div className=" flex items-center gap-2 justify-between">
              <input
                className="px-3 py-1 w-full rounded-md text-sm bg-violet-950"
                placeholder="Enter Code BOOST20 to get a 20% discount"
                name="applycode"
                onChange={handleChange}
              />
              <button
                className="px-3 py-1 bg-violet-800 text-sm rounded-md"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-center py-4 px-6 border-green-600 border rounded-lg bg-gradient-to-b from-green-900 to-green-[#ddd] relative text-green-400">
            -20% discount applied successfully 🎉
            <button
              className="absolute top-1/2 right-[10px] hover:text-green-300 -translate-x-1/2 -translate-y-1/2"
              onClick={() => setDiscount(false)}
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>
      <div className="pb-4">
        <div className="flex justify-between items-center">
          <label htmlFor="" className=" text-gray-500">
            Total Price
          </label>
          <span className="text-2xl font-bold">{price}€</span>
        </div>
        <button
          className={`w-full py-2 mt-4 flex items-center gap-4 justify-center rounded-lg ${classNames.btnClass}`}
          onClick={handleBuyBoost}
        >
          Buy Boost <FaArrowRight />
        </button>
      </div>
      {/* Champion & Role Modal */}
      <ModalChampionRole
        open={isOpenChampionRoleModal}
        setOpen={setisOpenChampionRoleModal}
        roles={current_rank?.roles}
        champions={current_rank?.champions}
        setRoles={(roles: any) => dispatch(setRoles(roles))}
        setChampions={(champions: any) => dispatch(setChampions(champions))}
      />
    </div>
  );
};
export default Checkout;
