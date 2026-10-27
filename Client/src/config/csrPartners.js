import HCLLogo from "../assets/HCL.svg";
import IITKanpurLogo from "../assets/iit-kanpur.png";
import RamanKantMunjalLogo from "../assets/raman-kant-munjal-foundation.png";
import HeroFutureEnergiesLogo from "../assets/hero-future-energies.png";
import { getStandalonePartnerName } from "../utils/portalMapping";

// CSR partners shown on the login page. To add one, put its logo in
// src/assets/ and add { name, logo } here; the section hides when empty.
export const CSR_PARTNERS = [
  { name: "Hindustan Copper Limited (HCL)", logo: HCLLogo },
  { name: "IIT Kanpur", logo: IITKanpurLogo },
  { name: "Raman Kant Munjal Foundation", logo: RamanKantMunjalLogo },
  { name: "Hero Future Energies", logo: HeroFutureEnergiesLogo },
];

const HCL_PARTNER_NAME = "Hindustan Copper Limited (HCL)";

/** The CSR partner that funds a portal: a standalone Kendra's own partner,
 *  or Hindustan Copper Limited for the HCL SATHEE portals. */
export const getPortalPartner = (portalName = "") => {
  const name = getStandalonePartnerName(portalName) || HCL_PARTNER_NAME;
  return CSR_PARTNERS.find((partner) => partner.name === name) || { name, logo: null };
};
