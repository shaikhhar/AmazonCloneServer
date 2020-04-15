const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const User = require('../models/user');
const config = require('../config');
const checkJWT = require('../middlewares/check-jwt');

router.post('/signup', (req, res, next) => {
    console.log("check 1 " + req.body.email);
    User.findOne({ email: req.body.email })
        .exec()
        .then(result => {
            if (result) {
                res.status(409).json({ success: false, message: "user with the email already exist" });
            } else {
                console.log("User is unique" + req.body.email);
                bcrypt.hash(req.body.password, null, null, (err, hash) => {
                    if (err) { return res.status(409).json({ success: false, message: "Signup failed" }) } else {
                        const user = new User({
                            name: req.body.name,
                            email: req.body.email,
                            password: hash,
                            isSeller: req.body.isSeller
                        });
                        user.save()
                            .then(() => {
                                user['token'] = jwt.sign({ user: user }, config.secret, { expiresIn: "2h" });
                                res.status(201).json({ success: true, message: user.name + " is created", token: user.token })
                            })
                            .catch(err => { res.status(500).json({ success: false, message: "Signup failed" }) })
                    }
                })

            }
        }).catch(err => { res.json({ message: err }) });

});
router.post('/login', (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length < 1) {
                return res.status(404).json({ success: false, message: "Auth failed e" });
            }
            console.log(user[0].email);
            var isValid = bcrypt.compareSync(req.body.password, user[0].password);
            console.log("is valid or not: " + isValid);
            if (isValid) {
                const token = jwt.sign({ user: user[0] },
                    config.secret, { expiresIn: "2h" }
                );
                return res.status(200).json({ success: true, message: "Auth successful", token: token });

            } else {
                res.status(404).json({ success: false, message: "Auth failed p" });
            }
        })
        .catch(err => {
            res.status(500).json({ success: false, message: err })
        });
});

// router.get('/profile');
// router.post('/profile');

router.route('/profile')
    .get(checkJWT, (req, res, next) => {
        User.findOne({ _id: req.decoded.user._id })
            .exec()
            .then(result => {
                res.status(200).json({ success: true, user: result, message: "successful" });
            })
            .catch(err => { res.status(500).json({ success: false, message: err }) });
    })
    .patch(checkJWT, (req, res, next) => {
        console.log("user: ");
        console.log("updateFields: ");
        User.findOne({ _id: req.decoded.user._id })
            .exec()
            .then(result => {
                const bodyFieldsAndValues = req.body;
                const updateFields = {};
                for (doc of bodyFieldsAndValues) {
                    if (updateFileds[doc.propName] === 'password') {
                        updateFileds[doc.propName] = hashPassword(doc.value);
                    }
                    updateFields[doc.propName] = doc.value;

                }
                console.log("user: " + JSON.stringify(result));
                console.log("updateFields: " + JSON.stringify(updateFields));
                User.update({ _id: result._id }, { $set: updateFields })
                    .exec()
                    .then(() => {
                        User.findById(result._id).exec().then((updatedProf) => {
                            res.json({ success: true, message: "Profile updated", updatedProfile: updatedProf })
                        })

                    })
            }).catch(err => {
                res.json({ success: false, message: err })
            });
    });

// address api
router.route('/address')
    .get(checkJWT, (req, res, next) => {
        User.findOne({ _id: req.decoded.user._id })
            .exec()
            .then(result => {
                res.status(200).json({ success: true, address: result.address, message: "successful" });
            })
            .catch(err => {
                res.status(500).json({ success: false, message: err });
            });
    })
    .post(checkJWT, (req, res, next) => {
        User.findOne({ _id: req.decoded.user._id })
            .exec()
            .then(user => {
                if (req.body.addr1) user.address.addr1 = req.body.addr1;
                if (req.body.addr2) user.address.addr2 = req.body.addr2;
                if (req.body.city) user.address.city = req.body.city;
                if (req.body.state) user.address.state = req.body.state;
                if (req.body.country) user.address.country = req.body.country;
                if (req.body.postalCode) user.address.postalCode = req.body.postalCode;

                user.save();
                res.json({ success: true, message: "address updated" });
            })
            .catch(err => {
                res.json({ success: false, message: err });
            });
    });

function hashPassword(password) {
    return bcrypt.hashSync(password, null);
}



module.exports = router;