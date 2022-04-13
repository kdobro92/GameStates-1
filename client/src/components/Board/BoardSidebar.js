import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

function BoardSidebar({ boardData, accessToken }) {
	const [nickname, setNickname] = useState('');

	useEffect(() => {
		axios
			.get('http://localhost:4000/user/getUserInfo', {
				headers: { authorization: `Bearer ${accessToken}` },
			})
			.then((res) => {
				// console.log(res.data.data.email);
				setNickname(res.data.data.nickname);
			});
	});

	return (
		<div className="sidebar">
			<div className="mypage">
				<div>
					<h4>{nickname} 님</h4> <br /> 게시글 수 : {boardData.length}
				</div>
				<button type="button" className="postCountButton">
					내가 쓴 글
				</button>
			</div>

			<div className="menu">
				<div className="menuTitle">
					<h3> 메뉴 </h3>
				</div>
				<div className="menuList">
					<Link to="/board">업데이트</Link>
				</div>
				<div className="menuList">
					<Link to="/board">커뮤니티</Link>
				</div>
			</div>
		</div>
	);
}

BoardSidebar.propTypes = {
	boardData: PropTypes.node.isRequired,
};
export default BoardSidebar;
