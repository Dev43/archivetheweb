import * as React from "react";
import { Container, Box } from "@chakra-ui/react";
import Hero from "./Hero";

const Home: React.FC = () => {
  return (
    <Container maxW={"1280px"}>
      <Box
        width={"100%"}
        color="grey"
        alignItems={"center"}
        justifyContent={"center"}
        justifyItems={"center"}
        justifySelf={"center"}
      >
        <Box
          alignItems={"center"}
          justifyContent={"center"}
          justifyItems={"center"}
          justifySelf={"center"}
        >
          Save a Website
        </Box>
        <Box
          alignItems={"center"}
          justifyContent={"center"}
          justifyItems={"center"}
          justifySelf={"center"}
        >
          Help create a historical log of important websites. Each snapshot is
          stored on Arweave, a permanent data storage solution.
        </Box>
      </Box>
      <Hero />
    </Container>
  );
};

export default Home;
