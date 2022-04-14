const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");
const { user } = require("../models");
const random = require("./validateEmail");
// 임시 수정 (user: User) 사용시 변환 질문하기
// model 명 일치시키기
const {
  generateAccessToken,
  isAuthorized,
} = require("../controller/tokenFunction");

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;
    // 암호화된 비밀번호 사용 시, password 제외, email로 유저를 찾기
    try {
      const User = await user.findOne({ where: { email } });
      if (!User || !bcrypt.compareSync(password, User.dataValues.password)) {
        return res.json({ message: "잘못된 정보를 입력하였습니다." });
      } else {
        delete User.dataValues.password;
        // 토큰 function 생성하기
        const accessToken = generateAccessToken(User.dataValues);
        // 토큰 생성 시 cookie에 담고, data: token 반환하기
        return res
          .status(200)
          .cookie("jwt", accessToken, {
            sameSite: "None",
            secure: true,
            httpOnly: true,
          })
          .json({ token: accessToken, message: "로그인 성공" });
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  logout: (req, res) => {
    // 토큰을 통해 인증된 사용자인지 확인 후 로그아웃 진행
    const userInfo = isAuthorized(req);
    try {
      if (userInfo) {
        // console.log(userInfo);
        return res
          .clearCookie("jwt", {
            sameSite: "None",
            secure: true,
            httpOnly: true,
          })
          .status(200)
          .json({ message: "로그아웃 성공" });
      } else {
        return res.json({ message: "이미 로그아웃 된 상태입니다." });
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  signup: async (req, res) => {
    const { email, nickname, password, validate } = req.body;

    if (!email || !nickname || !password || !validate) {
      return res.json({ message: "필수 항목을 입력하세요." });
    }
    try {
      if (Number(validate) !== random.number) {
        return res.json({ message: "Fail" });
      }
      const USER = await user.findOne({ where: { email, nickname } });
      // 비밀번호 암호화하기
      const hashed = await bcrypt.hash(password, 10);

      if (USER) {
        return res.json({ message: "이미 사용중인 이메일입니다." });
      } else {
        await user.create({
          email,
          role: 0,
          nickname,
          password: hashed,
        });
        return res.status(201).json({ message: "가입 완료" });
      }
    } catch (err) {
      return res.status(500).json({ message: "서버 에러" });
    }
  },

  googleCallback: async (req, res) => {
    const code = req.headers["authorization"];
    try {
      // Exchange authorization code for refresh tokens and access tokens
      const result = await axios.post(
        `https://oauth2.googleapis.com/token?code=${code}&client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&grant_type=authorization_code`
      );
      // Calling Google APIs with access token
      // 이부분을 클라이언트가 가져가야 하는 건지?
      //근데 회원가입, 로그인이라 이 자체는 여기 있어도 되나?
      //아니면 액세스 토큰을 이용해 클라이언트에서 직접 api호출하고, 클라이언트에서 정보 받아오면
      //그정보를 서버로 전달해서 로그인이나 회원 가입을 요청하나?
      const userInfo = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${result.data.access_token}`,
          },
        }
      );
      console.log(userInfo);
      const user1 = await user.findOrCreate({
        where: {
          email: userInfo.data.email,
        },
        defaults: {
          email: userInfo.data.email,
          role: 0,
          password: "",
          nickname: userInfo.data.name,
        },
      });
      delete user1[0].dataValues.password;
      const accessToken = generateAccessToken(user1[0].dataValues);
      // 토큰 생성 시 cookie에 담고, data: token 반환하기
      return res
        .status(201)
        .cookie("jwt", accessToken, {
          sameSite: "None",
          secure: true,
          httpOnly: true,
        })
        .json({ token: accessToken, message: "로그인 성공" });
    } catch (error) {
      res.sendStatus(500);
    }
  },
};
