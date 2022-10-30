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
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
import { DEPLOYED_ADDRESS } from "../../../constants/chain";
import { useStateProvider } from "../../../context/State";
import { useNavigate } from "react-router";
const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;
const Archives: React.FC = () => {
  let state = useStateProvider();
  const [data, setdata] = React.useState<any>([]);
  const navigate = useNavigate();
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
    for (let [orderID, order] of state.openOrders.entries()) {
      data.push(
        <LinkBox maxW="sm" p="5" borderWidth="1px" rounded="md">
          <LinkOverlay href={`/archives/${order.website}`}>
            <Flex key={orderID}>
              <Box
                bg="white"
                height="300px"
                width={"500px"}
                borderColor="rgba(0, 0, 0, 0.1)"
                borderRadius={"md"}
                borderWidth={"1px"}
              >
                <iframe
                  id={`frame-${orderID}`}
                  src={order.website}
                  width="100%"
                  height={"100%"}
                  scrolling="no"
                  frameBorder="0"
                  seamless={true}
                />

                <Center w="100%">
                  <Box color="black" marginTop={"10px"}>
                    URL: {order.website}
                  </Box>
                </Center>
              </Box>
            </Flex>
          </LinkOverlay>
        </LinkBox>
      );
    }
    setdata(data);
  };

  return (
    <Container maxW={"1280px"} my={10}>
      <Heading color="black">Explore Archives</Heading>
      <Box color="black">See which websites have been archived so far.</Box>
      <SimpleGrid minChildWidth="300px" spacing="40px">
        {data}
      </SimpleGrid>
    </Container>
  );
};

export default Archives;

function getIframeTitle(id: string) {
  // getting our iframe
  var iframe = document.getElementById(id);
  // logging the iframe's title
  console.log((iframe as any).contentWindow.document.title);
}
