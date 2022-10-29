import { MetaMaskInpageProvider } from "@metamask/providers";
import { StringOptionsWithImporter } from "sass";

export interface RPCErrorType {
  code: string | number;
  message: string;
  data?: {
    message: string;
  };
}

export interface CourseSummary {
  imageURL: string;
  name: string;
  description: string;
  author: string;
  address: string;
}

export interface MarkdownData {
  text: string;
  html: string;
}
export interface Module {
  name: string;
  description: string;
  materialsHash: string;
  questionsHash: string;
}

export interface FrontendModule {
  id: string;
  name: string;
  description: string;
  materials: any;
  questions: any;
}

export interface PullRequest {
  index: number;
  name: string;
  description: string;
  author: string;
  approved: boolean;
  tokens: number;
  approvers: number;
  baseVersion: number;
}
