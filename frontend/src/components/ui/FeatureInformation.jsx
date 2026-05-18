const FeatureInformation = (props) => {
	return(
		<div className="feature-information">
			<img src={props.image} alt="icon-image" style={{border:"1px solid black", padding:"3px", borderRadius:"5px"}}/>
			<h1 style={{marginTop:"5px", marginBottom:"10px"}}>{props.header}</h1>
			<div>{props.para}</div>
		</div>
	)
}

export default FeatureInformation;