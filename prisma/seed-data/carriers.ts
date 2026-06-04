import {
  InsuranceStatus,
  VerificationStatus,
} from '../../src/generated/prisma/client';

export const carriers = [
  {
    name: "Maersk",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "MSC",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "CMA CGM",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "Hapag-Lloyd",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "COSCO Shipping",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "DHL Global Forwarding",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "FedEx Logistics",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "UPS Supply Chain",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "DB Schenker",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
  {
    name: "Kuehne + Nagel",
    insuranceStatus: InsuranceStatus.COVERED,
    verificationStatus: VerificationStatus.VERIFIED,
  },
];