const User = require("../models/user.model")
const DB = require("../models/db.model")
const Match = require("../models/match.model")
const dateFns = require("date-fns")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const compareNames = (name1, name2) => {
    const name1Set = new Set(name1.toLowerCase().split(" "));
    return name2.toLowerCase().split(" ").reduce((count, word) => {
        if (name1Set.has(word)) {
            return count + 1;
        }
        return count;
    }, 0);
}

const getOppositeGender = (g) => {
    if(g === "M") return "F"
    if(g === "F") return "M"
    return "O"
}

// match making algorithm
const user_match_get = async (req, res) => {
    if(!req.userID) {
        res.status(400).json({ message: "Bad Credentials" })
        return
    }

    const today = new Date();
    if(today < new Date("2024-03-01 00:00:00")) {
        res.status(400).json({ message: "Time Out" })
        return
    }

    // if match already exists
    const match = await Match.findOne({ $or : [{ user1: req.userID}, { user2: req.userID}]})
    if(match) {
        if(match.user1 == req.userID) {
            const matched = await User.findOne({ _id: match.user2})
            res.status(200).json(matched)
            return
        }
        if(match.user2 == req.userID){
            const matched = await User.findOne({ _id: match.user1})
            res.status(200).json(matched)
            return
        }
    }

    // if match does not exist, find a match
    try {
        const user = await User.findOne({ _id: req.userID})
        // case 1: if has no crush...
        if(!user.crush) {

            // case 1.1: someone has a crush on the user
            // get those users and match with the one with the highest popularity

            const firstName = user.name.split(" ")[0];
            const lastName = user.name.split(" ")[1] || "";
            const regexName = new RegExp(`^${firstName}\\b.*${lastName}\\b`, 'i');
            const crushes = await User.find({ gender : getOppositeGender(user.gender), crush: { $regex: regexName } });

            if (crushes.length > 0) {
                const crushPopularity = crushes.map((crush) => crush.popularity);
                const maxPopularity = Math.max(...crushPopularity);
                const matched = crushes.find((crush) => crush.popularity === maxPopularity); //finds the first match
                
                const match = new Match({
                    user1: user._id,
                    user2: matched._id
                });
                match.save()
                .then((match) => {
                    res.status(200).json(matched)
                })
                .catch((err) => {
                    res.status(404).json({ message: "Match making failed."})
                })
                return
            }
            else {
                // case 1.2: no one has a crush on the user
                // select a random user that hasn't been matched yet
                const users = await User.find({ gender: getOppositeGender(user.gender) });
                // iterate through the users and get those that haven't been matched yet by comparing their ids with the ids of the users in the matches collection
                const matchables = users.filter( async (user) => {
                    const match = await Match.findOne({ $or : [{ user1: user._id}, { user2: user._id}]});
                    return !match;
                });

                if(matchables.length === 0) {
                    res.status(400).json({ message: "No match found."})
                    return
                }

                const randomIndex = Math.floor(Math.random() * matchables.length);

                const match = new Match({
                    user1: user._id,
                    user2: matchables[randomIndex]._id
                });
                match.save()
                .then((match) => {
                    res.status(200).json(matchables[randomIndex])
                })
                .catch((err) => {
                    res.status(404).json({ message: "Match making failed."})
                })
                return
            }
        }
        
        // case 2: if has a crush...

        const firstName = user.name.split(" ")[0];
        const lastName = user.name.split(" ")[1] || "";
        const regexName = new RegExp(`^${firstName}\\b.*${lastName}\\b`, 'i');
        const crushes = await User.find({ gender : getOppositeGender(user.gender), crush: { $regex: regexName } });

        if (crushes.length > 0) {

            // case 2.1: crush has a crush on the user

            const perfectMatch = crushes.find((crush) => compareNames(crush.name, user.crush) >= 2);
            if (perfectMatch) {
                const match = new Match({
                    user1: user._id,
                    user2: perfectMatch._id
                });
                match.save()
                .then((match) => {
                    res.status(200).json(perfectMatch)
                })
                .catch((err) => {
                    res.status(404).json({ message: "Match making failed."})
                })
                return
            }

            // case 2.2: crush does not have a crush on the user but someone else has a crush on the user
            
            const crushPopularity = crushes.map((crush) => crush.popularity);
            const maxPopularity = Math.max(...crushPopularity);
            const matchable = crushes.find((crush) => crush.popularity === maxPopularity); //finds the first match
            
            // case 2.2.2: has lower popularity than the crush -> match with one of those who has a crush on the user
            if(user.popularity < maxPopularity) {
                const match = new Match({
                    user1: user._id,
                    user2: matchable._id
                });
                match.save()
                .then((match) => {
                    res.status(200).json(matchable)
                })
                .catch((err) => {
                    res.status(404).json({ message: "Match making failed."})
                })
                return
            }
            
            // case 2.2.1: has higher popularity than the crush -> match with the crush
            // find his crush and match them
            const crush = await User.findOne({gender : getOppositeGender(user.gender),
                 $or : [
                    {name: user.crush},
                    {name: user.crush.split(" ")[0]},
                 ]
            });

            if(crush) {
                const match = new Match({
                    user1: user._id,
                    user2: crush._id
                });
                match.save()
                .then((match) => {
                    res.status(200).json(crush)
                })
                .catch((err) => {
                    res.status(404).json({ message: "Match making failed."})
                })
                return
            }

            // match with random user
            const users = await User.find({ gender: getOppositeGender(user.gender) });
            const matchables = users.filter( async (user) => {
                const match = await Match.findOne({ $or : [{ user1: user._id}, { user2: user._id}]});
                return !match;
            });

            const randomIndex = Math.floor(Math.random() * matchables.length);
            const match = new Match({
                user1: user._id,
                user2: matchables[randomIndex]._id
            });
            match.save()
            .then((match) => {
                res.status(200).json(matchables[randomIndex])
            })
            .catch((err) => {
                res.status(404).json({ message: "Match making failed."})
            })
            return
        }
        else{

            // case 2.3: no one has a crush on the user
            // case 2.3.1: has higher popularity than the crush -> match with the crush
            // case 2.3.2: has lower popularity than the crush -> match with random user

            const crush = await User.findOne({gender : getOppositeGender(user.gender),
                $or : [
                    {name: user.crush},
                    {name: user.crush.split(" ")[0]},
                ]
            });

            if(crush) {
                if(user.popularity >= crush.popularity) {
                    const match = new Match({
                        user1: user._id,
                        user2: crush._id
                    });
                    match.save()
                    .then((match) => {
                        res.status(200).json(crush)
                    })
                    .catch((err) => {
                        res.status(404).json({ message: "Match making failed."})
                    })
                    return
                }
            }

            const users = await User.find({ gender: getOppositeGender(user.gender) });
            const matchables = users.filter( async (user) => {
                const match = await Match.findOne({ $or : [{ user1: user._id}, { user2: user._id}]});
                return !match;
            });

            const randomIndex = Math.floor(Math.random() * matchables.length);
            const match = new Match({
                user1: user._id,
                user2: matchables[randomIndex]._id
            });
            match.save()
            .then((match) => {
                res.status(200).json(matchables[randomIndex])
            })
            .catch((err) => {
                res.status(404).json({ message: "Match making failed."})
            })
            return
        }
    }
    catch(err) {
        res.status(404).json({ message: "Internal server error."})
    }
}

const user_profile_get = (req, res) => {
    if(!req.userID) {
        res.status(400).json({ message: "Bad Credentials" })
        return
    }
    
    User.findOne({ _id: req.userID})
    .then((user) => {
        res.status(200).json(user)
    })
    .catch((err) => {
        res.status(404).json({ message: "404 Not Found"})
    })
}

const user_signup_post = (req, res) => {
    /* req.body structure 
    {
        "photo" : ...,
        "rollNo" : ...,
        "name" : ...,
        "gender" : ...,
        "email" : ...,
        "password" : ...,
        "branch" : ...,
        "crush" : ..., [fullname of the crush, not just the first name !!!]
        "instagram_username" : ...,
        "facebook_username" : ...,
        "linkedin_username" : ...,
        "twitter_username" : ...
    }
    */

    const { rollNo } = req.body

    DB.findOne({ rollNo })
    .then((validUser) => {
        if(!validUser){
            res.status(400).json({ message: "Not an NITJian"})
            return
        }
        User.findOne({ rollNo })
        .then((user) => {
            if(user) {
                res.status(400).json({ message: "User already exists"})
                return
            }
            if(!req.file) {
                res.status(400).json({ message: "Please upload a photo"})
                return
            }
            const filename = req.file.filename;
            const imageUrl = `${req.protocol}://${req.get('host')}/usercontent/${filename}`;
            const hashedPassword = bcrypt.hashSync(req.body.password, 10)
            const myUser = new User({
                photo: imageUrl,
                rollNo,
                name : req.body.name.toLowerCase(),
                gender : req.body.gender.toUpperCase(),
                email : req.body.email.toLowerCase(),
                password : hashedPassword,
                branch : req.body.branch.toUpperCase(),
                crush : req.body.crush.toLowerCase(),
                instagram_username : req.body.instagram_username,
                facebook_username : req.body.facebook_username,
                linkedin_username : req.body.linkedin_username,
                twitter_username : req.body.twitter_username
            })
            myUser.save()
            .then((user) => {
                const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
                res.status(201).json({
                    user,
                    token
                })
            })
            .catch((err) => {
                res.status(400).json({err : err.message})
            })
        })
    })
    .catch((err) => {
        res.status(404).json({ message: "404 Not Found"})
    })
}


const user_signin_post = (req, res) => {
    const {rollNo, password} = req.body

    User.findOne({rollNo})
    .then((user) => {
        if(!user) {
            res.status(400).json({ message: "User does not exist" })
            return
        }
        const isPasswordCorrect = bcrypt.compareSync(password, user.password)
        if(!isPasswordCorrect) {
            res.status(400).json({ message: "Bad Credentials" })
            return
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
        res.status(200).json({
            user,
            token
        })
    })
    .catch((err) => {
        res.status(404).json({ message: "404 Not Found"})
    })
}

// cron job ------------------------------------------------

const updateUserPopularity = async (user) => {
    const firstName = user.name.split(" ")[0];
    const lastName = user.name.split(" ")[1] || "";
    const regexName = new RegExp(`^${firstName}\\b.*${lastName}\\b`, 'i');
    const matches = await User.find({ crush: { $regex: regexName } });
    return matches.length;
};

const updateAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        const updatePromises = users.map(async (user) => {
            const popularity = await updateUserPopularity(user);
            return User.findByIdAndUpdate(user._id, { $set: { popularity } });
        });
        await Promise.all(updatePromises);
        res.status(200).json({ message: 'Popularity updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.' });
    }
};

module.exports = {
    user_signin_post,
    user_signup_post,
    user_profile_get,
    user_match_get,
    update_all_users : updateAllUsers
}