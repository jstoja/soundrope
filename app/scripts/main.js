/** @jsx React.DOM */
'use strict';

var client_id = "d2cda7a5597f57543f0caec0fbdad68b";
require.config({
	baseUrl: 'scripts',
	paths: {
		react: 'script/react.min'
	},
	shim: {
		react: {
			exports: 'React'
		}
	}
});
function getQueryVariable(url, variable) {
	var query = url.split('?');
	var vars = query[1].split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == variable) {
			return decodeURIComponent(pair[1]);
		}
	}
	console.log('Query variable %s not found', variable);
}

var SoundcloudPlayer = React.createClass({displayName: 'SoundcloudPlayer',
	getInitialState: function() {
		return ({player: null});
	},
	nextMusicWhenEnded: function() {
		this.props.nextMusic();
	},
	loadPlayer: function() {
		var iframe = document.getElementById('player');
		iframe.src = "https://w.soundcloud.com/player/?url="+ this.props.music.uri;
		var widget = SC.Widget(iframe);
		widget.bind(SC.Widget.Events.READY, function() {
			this.play();
		}.bind(widget));

		return (
			player
		);
	},
	componentDidMount: function() {
		this.setState({player: this.loadPlayer(this.props.music)});
		console.log('New soundcloud player');
	},
	render: function() {
		return (
			React.DOM.iframe( {id:"player"}
			)
		);
	}
});

var YoutubePlayer = React.createClass({displayName: 'YoutubePlayer',
	getInitialState: function() {
		return ({player: null});
	},
	nextMusicWhenEnded: function(event) {
		if (event.data === YT.PlayerState.ENDED) {
			this.props.nextMusic();
		}
	},
	getVideoId: function(video) {
		var videoIds = video.id.$t.split(':');
		return videoIds[videoIds.length - 1];
	},
	loadPlayer: function() {
		return(
			new YT.Player('player', {
				videoId: this.getVideoId(this.props.music),
				playerVars: { 'autoplay': 1},
				events: {
					'onStateChange': this.nextMusicWhenEnded
				}
			})
		);
	},
	changeMusic: function(music) {
		if (this.state.player != null) {
			this.state.player.loadVideoById({
				'videoId': this.getVideoId(music),
				'startSeconds': 0
			});
		}
	},
	componentDidMount: function() {
		this.setState({player: this.loadPlayer()});
		console.log("New youtube player");
	},
	render: function() {
		return (
			React.DOM.div( {id:"player"}
			)
		);
	}
});

var Playlist = React.createClass({displayName: 'Playlist',
	getInitialState: function() {
		return {songs: []};
	},
	addYoutubeMusic: function(url) {
		var videoId = getQueryVariable(url, 'v');
		var query = 'https://gdata.youtube.com/feeds/api/videos/' + videoId + '?v=2&alt=json';
		$.ajax({
			url: query,
			dataType: 'json',
			success: function (data) {
				this.refs.musicId.getDOMNode().value = '';
				data.entry.type = 'youtube';
				data.entry.title = data.entry.title.$t;
				this.setState({songs: this.state.songs.concat([data.entry])});
			}.bind(this),
			error: function(xhr, status, err) {
			}.bind(this)
		});
	},
	addSoundcloudMusic: function(url) {
		var query = "http://api.soundcloud.com/resolve.json?url=" + url + "&client_id=" + client_id;
		$.ajax({
			url: query,
			dataType: 'json',
			success: function (data) {
				this.refs.musicId.getDOMNode().value = '';
				data.type = 'soundcloud';
				this.setState({songs: this.state.songs.concat([data])});
			}.bind(this),
			error: function(xhr, status, err) {
			}.bind(this)
		});
	},
	handleSubmit: function() {
		var musicLink = this.refs.musicId.getDOMNode().value.trim();

		if (musicLink.match(/.+(soundcloud).+/)) {
			this.addSoundcloudMusic(musicLink);
		} else if (musicLink.match(/.+(youtube).+/)) {
			this.addYoutubeMusic(musicLink);
		}
		return false;
	},
	nextSong: function() {
		return this.state.songs.shift();
	},
	killMusic: function(songIndex) {
		var songs = [];
		this.state.songs.forEach(function(song, ndx) {
			if (ndx != songIndex) {
				songs.push(song);
			}
		});
		this.replaceState({songs: songs});
	},
	render: function() {
		var style = '';
		var songsList = this.state.songs.map(function (song, songIndex) {
			console.log('list of songs: ' + song.title);
			if (songIndex %2 == 0) {
				style = 'pair';
			} else {
				style = 'odd';
			}
			return (
				React.DOM.li( {className:style}, 
					song.title,
					React.DOM.span(null, "[",React.DOM.a( {href:"#", onClick:this.killMusic.bind(this, songIndex)}, "X"),"]")
				)
			);
		}.bind(this));
		return (
			React.DOM.div( {className:"playlist"}, 
				React.DOM.ul(null, 
					songsList
				),
				React.DOM.div( {className:"addMusic"}, 
					React.DOM.h2(null, "Add a new music"),
					React.DOM.form( {onSubmit:this.handleSubmit}, 
						React.DOM.input( {type:"text", ref:"musicId", placeholder:"Youtube VideoID"} ),
						React.DOM.input( {type:"submit", value:"Post"} )
					)
				)
			)
		);
	}
});

var Player = React.createClass({displayName: 'Player',
	getInitialState: function() {
		return ({
			player: null,
			willChangePlayer: false
		});
	},
	componentDidMount: function() {
		//this.setState({player: this.props.music.type});
	},
	componentWillReceiveProps: function(nextProps) {
		var change = this.state.willChangePlayer;
		if (this.state.player !== nextProps.music.type) {
			this.setState({player: nextProps.music.type, willChangePlayer: true});
		}
	},
	shouldComponentUpdate: function() {
		console.log(this.state.player + " ?= " + this.props.music.type);
		if (this.state.willChangePlayer === true) {
			console.log("I JUST WANT TO CHANGE THE MUSIC OF THE PLAYER");
			this.refs.player.changeMusic(this.props.music);
			return false; // DO NOT re-RENDER
		} else {
			console.log("I NEED A NEW PLAYER");
		}
	},
	nextMusic: function() {
		this.props.nextMusic();
	},
	render: function() {
		if (this.props.music.type === "youtube") {
			return YoutubePlayer( {className:"player", ref:"player", music:this.props.music, nextMusic:this.nextMusic});
		} else if (this.props.music.type === "soundcloud") {
			return SoundcloudPlayer( {className:"player", ref:"player", music:this.props.music, nextMusic:this.nextMusic} );
		}
	}
});

var App = React.createClass({displayName: 'App',
	getInitialState: function() {
		return {currentMusic: null, player: null}
	},
	nextMusic: function() {
		var nextSong = this.refs.playlist.nextSong();
		this.setState({currentMusic: nextSong});
	},
	render: function() {
		var player = null;
		if (this.state.currentMusic !== null) {
			player = Player( {ref:"player", music:this.state.currentMusic, nextMusic:this.nextMusic});
		}
		return (
			React.DOM.div( {className:"content"}, 
				React.DOM.div( {id:"logo"}),
				React.DOM.div( {className:"player"}, 
					player
				),
				React.DOM.h1( {onClick:this.nextMusic}, "Next music !"),
				Playlist( {className:"playlist", ref:"playlist"} )
			)
		);
	}
});

var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function onYouTubeIframeAPIReady() {
	React.renderComponent(
		App(null ),
		document.getElementById('app')
	);
}
