const FeatureInformation = ({ image, header, para }) => {
  return (
    <div className="feature-information">
      <img
        className="feature-information__icon"
        src={image}
        alt={`${header} icon`}
      />
      <h2 className="feature-information__title">{header}</h2>
      <p className="feature-information__copy">{para}</p>
    </div>
  );
};

export default FeatureInformation;
