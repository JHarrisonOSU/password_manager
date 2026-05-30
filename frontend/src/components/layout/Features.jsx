import FeatureInformation from "../ui/FeatureInformation";
import lock from "../../assets/lock.png";
import fingerprint from "../../assets/fingerprint.png";
import encryptionIcon from "../../assets/encrypticon.png";

const Features = () => {
  return (
    <div className="features-grid">
      <FeatureInformation
        image={lock}
        header="Zero Knowledge System"
        para="Your password never leaves your browser and we cannot view your password. Your data is encrypted with a key unique to your account and your information is derived when you enter your master password in the browser."
      />
      <FeatureInformation
        image={fingerprint}
        header="Multi-Factor Authentication"
        para="Multi-Factor Authentication adds an extra layer of security to your account by requiring not just a password, but also a second verification step. This helps protect your account from unauthorized access even if your password is compromised."
      />
      <FeatureInformation
        image={encryptionIcon}
        header="Advanced Encryption Methods"
        para="Uses industry-leading algorithms for password hashing and encryption. These algorithms are designed to withstand brute-force attacks and future-proof against evolving security threats. Your passwords are never stored in plain text."
      />
    </div>
  );
};

export default Features;
