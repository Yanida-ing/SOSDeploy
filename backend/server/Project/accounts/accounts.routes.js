const express = require('express');
const router = express.Router();

const Account = require("./service/account");

// router.get("/singup", Account.onQuerys);
router.post("/singin", Account.verifyIdTokenGoogle, Account.SingIn);



// app.post(path + "/singup", Infomation_Accounts.SingUp);
// app.post(path + "/singin", Infomation_Accounts.verifyIdTokenGoogle, Infomation_Accounts.SingIn);


module.exports = router;
