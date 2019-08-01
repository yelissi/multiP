function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.random = (min, max) => {
    return random(min, max);
}

module.exports.getRandomColor = () => {
    var colors = ["orange", "green", "purple", "olive", "gray", "gold", "slateblue", "dodgerblue", "chocolate", "darkslategray", "crimson", "violet", "brown"];

    return colors[random(0, colors.length - 1)];
}