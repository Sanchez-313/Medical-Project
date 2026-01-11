import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
  Button,
  Tooltip,
  IconButton,
} from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faStar,
  faCartShopping,
} from "@fortawesome/free-solid-svg-icons";

export default function Product() {
  return (
    <Card className="w-full max-w-[26rem] shadow-lg">
      <CardHeader floated={false} className="bg-blue-gray-500">
        <img
          src="/src/assets/medicine/Engmedicines/ParacetamolTablets500.webp"
          alt="ParacetamolTablets500mg"
        />
        <div className="to-bg-black-10 absolute inset-0 h-full w-full bg-gradient-to-tr from-transparent via-transparent to-black/60" />
        <IconButton
          size="sm"
          color="red"
          variant="text"
          className="!absolute top-4 right-4 rounded-full"
        >
          <FontAwesomeIcon icon={faHeart} className="h-6 w-6" />
        </IconButton>
      </CardHeader>

      <CardBody>
        <div className="mb-3 flex items-center justify-between">
          <Typography variant="h5" color="blue-gray" className="font-medium">
            Paracetamol Tablets (500mg)
          </Typography>
          <Typography
            color="blue-gray"
            className="flex items-center gap-1.5 font-normal"
          >
            <FontAwesomeIcon
              icon={faStar}
              className="-mt-0.5 h-5 w-5 text-yellow-700"
            />
            5.0
          </Typography>
        </div>
        <Typography color="gray">
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard dummy text ever
          since the 1500s, when an unknown printer took a galley of type and
          scrambled it to make a type specimen book.
        </Typography>
        <div className="group mt-8 inline-flex flex-wrap items-center gap-3">
          <Typography
            variant="h5"
            color="amber"
            className="font-medium text-zinc-500"
          >
            1499 Kyats per card
          </Typography>
          <Tooltip content="1499 Kyats per card">
            <span className="cursor-pointer rounded-full border border-gray-900/5 bg-gray-900/5 p-3 text-gray-900 transition-colors hover:border-gray-900/10 hover:bg-gray-900/10 hover:!opacity-100 group-hover:opacity-70"></span>
          </Tooltip>
        </div>
      </CardBody>

      <CardFooter>
        <Button size="md" fullWidth={true}>
          Add to Cart <FontAwesomeIcon icon={faCartShopping} />
        </Button>
      </CardFooter>
    </Card>
  );
}
