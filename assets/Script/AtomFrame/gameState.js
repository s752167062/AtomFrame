
var GameState = {
    default:0,
    logo:1,
    login:2,
    hall:3,
    room:4
}

cc.Class({
    extends: cc.Component,

    properties: {
        TAG: "gameState",
    },

    ctor: function () {
        console.log("-new:" + this.TAG);
        this.gameState = GameState.default;
    },

    onLoad: function () {
        console.log("-load:" + this.TAG);
    },

    onDestroy: function () {
        console.log("-destory:" + this.TAG);
    },

    //
    setGameInLogo: function () {
        this.gameState = GameState.logo;
    },

    isGameInLogo: function () {
        return this.gameState == GameState.logo;
    },

    setGameInLogin: function () {
        this.gameState = GameState.login;
    },

    isGameInLogin: function () {
        return this.gameState == GameState.login;
    },

    setGameInHall: function () {
        this.gameState = GameState.hall;
    },

    isGameInHall: function () {
        return this.gameState == GameState.hall;
    },

    setGameInRoom: function () {
        this.gameState = GameState.room;
    },

    isGameInRoom: function () {
        return this.gameState == GameState.room;       
    },

});
