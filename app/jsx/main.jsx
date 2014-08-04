/** @jsx React.DOM */
'use strict';

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
var YoutubePlayer = React.createClass({
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
		this.setState({player: this.loadPlayer(this.props.music)});
		console.log("New youtube player");
	},
	render: function() {
		return (
			<div id='player'>
			</div>
		);
	}
});

var Votes = React.createClass({
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
				this.setState({songs: this.state.songs.concat([data.entry])});
			}.bind(this),
			error: function(xhr, status, err) {
			}.bind(this)
		});
	},
	handleSubmit: function() {
		var musicLink = this.refs.musicId.getDOMNode().value.trim();

		if (musicLink.match(/.+(soundcloud).+/)) {
			console.log("Soundcloud");
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
			console.log('list of songs: ' + song.title.$t);
			if (songIndex %2 == 0) {
				style = 'pair';
			} else {
				style = 'odd';
			}
			return (
				<li className={style}>
					{song.title.$t}
					<span>[<a href='#' onClick={this.killMusic.bind(this, songIndex)}>X</a>]</span>
				</li>
			);
		}.bind(this));
		return (
			<div className='votes'>
				<ul>
					{songsList}
				</ul>
				<div className='addMusic'>
					<h2>Add a new music</h2>
					<form onSubmit={this.handleSubmit}>
						<input type='text' ref='musicId' placeholder='Youtube VideoID' />
						<input type='submit' value='Post' />
					</form>
				</div>
			</div>
		);
	}
});


var App = React.createClass({
	getInitialState: function() {
		return {currentMusic: null, player: null}
	},
	handleChange: function() {
		var nextSong = this.refs.votes.nextSong();
		this.setState({currentMusic: nextSong});

		if ((this.state.currentMusic !== null) && (this.state.player === this.state.currentMusic.type)) {
			console.log("I JUST WANT TO CHANGE THE MUSIC OF THE PLAYER");
			this.refs.player.changeMusic(nextSong);
		} else {
			console.log("I NEED A NEW PLAYER");
			this.setState({player: nextSong.type});
		}
		//console.log(this.state.player);
		//this.refs.player.changeMusic(nextSong);
	},
	getPlayer: function() {
		var player = null;
		if (this.state.player !== null && this.state.currentMusic !== null) {
			if (this.state.currentMusic.type === "youtube") {
				player = <YoutubePlayer className='player' ref='player' music={this.state.currentMusic} nextMusic={this.handleChange}/>;
			} else if (this.state.currentMusic.type === "soundcloud") {
				player = <SoundcloudPlayer className='player' ref='player' nextMusic={this.hangleChange} />;
			}
		}
		return player
	},
	render: function() {
		return (
			<div className='content'>
				<div id='logo'></div>
				<div className='player'>
					{this.getPlayer()}
				</div>
				<h1 onClick={this.handleChange}>Next music !</h1>
				<Votes className='votes' ref='votes' nextSong={this.registerNextSong} />
			</div>
		);
	}
});

var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
function onYouTubeIframeAPIReady() {
	React.renderComponent(
		<App />,
		document.getElementById('app')
	);
}
