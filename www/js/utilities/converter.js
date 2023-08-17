function transformDecimalToMinutesAndSeconds(value){
	const degrees = Math.floor(value);
	const minutes = getDecimalPortion(value) * 60;
	const seconds = getDecimalPortion(minutes) * 60;
	let minutesStr = Math.trunc(minutes).toString();
	minutesStr = minutesStr.length === 1 ? '0' + minutesStr : minutesStr;
	const secondsStr = seconds.toFixed(2);
	return `${degrees}°${minutesStr}'${secondsStr}"`;
}

function getDecimalPortion(float){
	return float % 1;
}

function transformToDecimal(value){
	const degrees = parseFloat(value.slice(0, value.indexOf('°')));
	const minutes = (parseFloat(value.slice(value.indexOf('°') + 1, value.indexOf('\''))) / 60) || 0;
	const seconds = (parseFloat(value.slice(value.indexOf('\'') + 1, value.indexOf('\'\''))) / 3600) || 0;
	const res = degrees + minutes + seconds;
	return res.toFixed(7);
}