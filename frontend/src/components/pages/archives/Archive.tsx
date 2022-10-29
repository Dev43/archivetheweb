import * as React from "react";

import {
  Box,
  Center,
  Image,
  Text,
  Heading,
  Stack,
  Avatar,
  useColorModeValue,
  Container,
  SimpleGrid,
  Flex,
  VStack,
  StackDivider,
} from "@chakra-ui/react";
import { useParams } from "react-router";
import { useStateProvider } from "../../../context/State";

const Archive: React.FC = () => {
  const [data, setdata] = React.useState<any>([]);

  let params = useParams();
  console.log(params);
  let website = params["*"];
  let state = useStateProvider();
  React.useEffect(
    () => {
      if (state) {
        createData(state);
      }
      return () => {};
    },
    [state]
  );

  const createData = async (state: any) => {
    console.log("creating data");
    let data: any = [];
    console.log(state.openOrders);
    let order = state.openOrders.filter(
      (obj: { website: string | undefined }) => obj.website == website
    );
    console.log(order);
    if (!order || order.length === 0) {
      return;
    }
    console.log(order[0]);
    order = order[0];
    for (let [claimID, claim] of order.claims.entries()) {
      data.push(
        <Flex key={claimID}>
          <Box h="40px" color="gray">
            <a
              href={`https://arweave.net/${claim.claimer_tx}`}
              target={"_blank"}
            >
              {claim.claimer_tx}
            </a>
          </Box>
        </Flex>
      );
    }
    setdata(data);
  };

  return (
    <Container maxW={"1280px"} my={10}>
      <Heading color="black">
        Explore Archive {">"} {params.id}
      </Heading>
      <Box color="grey">Viewing all snapshots for {website}</Box>
      <Flex
        // my={"140px"}
        height={"685px"}
        borderWidth="1px"
        borderRadius="lg"
        borderColor={"grey"}
      >
        <Flex
          p={8}
          flex={1}
          alignItems={"center"}
          justify={"center"}
          border={"medium"}
          width="100%"
          color={"grey"}
          borderWidth="1px"
          borderRadius="lg"
        >
          <VStack
            divider={<StackDivider borderColor="gray.200" />}
            spacing={1}
            width="100%"
            align="stretch"
          >
            {data}
          </VStack>
        </Flex>
        <Flex p={8} flex={1} alignItems={"center"} justify={"center"}>
          <iframe
            id="myFrame"
            width={"100%"}
            height="500px"
            // style={{
            //   "iframe": {

            //   }
            // }}
            src={"https://ethlisbon.org"}
          />
        </Flex>
      </Flex>
    </Container>
  );
};

export default Archive;

function getIframeTitle(id: string) {
  // getting our iframe
  var iframe = document.getElementById(id);
  // logging the iframe's title
  console.log((iframe as any).contentWindow.document.title);
}

const isValidUrl = (urlString: string) => {
  var urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};
