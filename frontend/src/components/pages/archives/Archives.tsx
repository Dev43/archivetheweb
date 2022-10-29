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
} from "@chakra-ui/react";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;
const Archives: React.FC = () => {
  const [state, setstate] = React.useState<any>(null);
  const [data, setdata] = React.useState<any>([]);

  React.useEffect(() => {
    (async () => {
      let arch = await warp
        .contract("9l0EYIHlekDMHRbZusiovgcIb4hkJO-ZJ6X2fQ1x0to")
        .setEvaluationOptions({
          internalWrites: true,
        });

      let state = (await arch.viewState({
        function: "getState",
      })).state;

      setstate(state);
      await createData(state);

      //   now we get other
    })();
    return () => {};
  }, []);
  //   React.useEffect(() => {
  //     console.log("trying");
  //     console.log(getIframeTitle("frame-0"));
  //     return () => {};
  //   }, []);
  const createData = async (state: any) => {
    console.log("creating data");
    let data: any = [];
    for (let [orderID, order] of state.openOrders.entries()) {
      data.push(
        <Flex key={orderID}>
          <Box bg="white" height="300px" width={"500px"}>
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
              <Box color="grey">{order.website}</Box>
            </Center>
          </Box>
        </Flex>
      );
    }
    setdata(data);
  };

  return (
    <Container maxW={"1280px"} my={10}>
      <Heading>Explore Archives</Heading>
      See which websites have been archived so far.
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
