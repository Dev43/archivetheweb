import * as React from "react";
import Identicon from "react-identicons";
import { useNavigate } from "react-router";
import {
  Box,
  Flex,
  Link,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Center,
} from "@chakra-ui/react";
import { useAddress } from "../../context/Address";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { GiSpellBook } from "react-icons/gi";
import ConnectWallet from "./ConnectWallet";
import UserDisplay from "../ui/UserDisplay";
import styles from "./Navigation.module.sass";

const NavLink = ({
  children,
  path,
}: {
  children: React.ReactNode;
  path: string;
}) => {
  const navigate = useNavigate();
  return (
    <Link
      color="white"
      px={2}
      py={1}
      ml={"5px"}
      rounded={"md"}
      _hover={{
        textDecoration: "none",
        bg: "secondary",
      }}
      onClick={() => navigate(path)}
    >
      {children}
    </Link>
  );
};
interface NavProps {
  connectWallet: () => void;
}

const Nav: React.FC<NavProps> = ({ connectWallet }: NavProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const address = useAddress();
  const navigate = useNavigate();

  const navigateToHomepage = (): void => {
    navigate("/");
  };

  const isWalletConnected = !!address;

  return (
    <>
      <Box px={4}>
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <Stack
            onClick={navigateToHomepage}
            direction={"row"}
            // border={"2px solid white"}
            borderRadius={"sm"}
            px={4}
            py={2}
            cursor={"pointer"}
            _hover={{
              background: "secondary",
            }}
          >
            <GiSpellBook color="grey" fill="white" size={20} />
            <Box color="grey">ArchiveTheWeb</Box>
          </Stack>
          <Flex alignItems={"center"}>
            <NavLink path={"/"}>
              <Box color="grey">Save a Website</Box>
            </NavLink>
            <NavLink path={"/archives"}>
              <Box color="grey">Explore Archive</Box>
            </NavLink>
            <NavLink path={"/"}>
              <Box color="grey">FAQs</Box>
            </NavLink>
            {/* <NavLink path={'/about'}>About</NavLink> */}
          </Flex>

          <Flex alignItems={"center"}>
            <Stack direction={"row"} spacing={7}>
              {isWalletConnected ? (
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={"full"}
                    variant={"link"}
                    cursor={"pointer"}
                    minW={0}
                  >
                    <UserDisplay address={address} />
                  </MenuButton>
                  <MenuList alignItems={"center"} px={3}>
                    <br />
                    <Center>
                      <Identicon
                        string={address}
                        size={100}
                        styles={{ background: "white" }}
                      />
                    </Center>
                    <br />
                    <Center>
                      <p>{address}</p>
                    </Center>
                    <br />
                    <MenuDivider />
                    <MenuItem>Logout</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <ConnectWallet connectWallet={connectWallet} />
              )}
            </Stack>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};

export default Nav;
