var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Dishes = require('../models/dishes');

var favoriteRouter = express.Router();

var Favorites = require('../models/favorites');
var Verify = require('./verify');

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')

    .get(Verify.verifyOrdinaryUser, function(req,res,next){
        
    Favorites.find({"postedBy":req.decoded._doc._id})
        .populate('postedBy')
        .populate('dishes')
        .exec(function (err, favorite) {
        if (err) throw err;
        if (!favorite) {
            res.json(null);
        }else{
            res.json(favorite);
        }
    });

})



.post(Verify.verifyOrdinaryUser, function(req, res, next){
      
    Dishes.findById(req.body.dishId, function(err,dish){
    if (err) throw err;
      
        Favorites.find({"postedBy": req.decoded._doc._id},{"_id":1}).limit(1)
        .exec(function(err,favoriteID){
        if (err) throw err;

        if (favoriteID.length === 0){
            Favorites.create({
            postedBy : req.decoded._doc._id,
            dishes : [dish._id]
        }, function (err, favorite){
            if (err) throw err;
            res.json(favorite);
            });
        }else{

        Favorites.find({"postedBy": req.decoded._doc._id})
        .exec(function (err, favoritecursor){
        if (err) throw err;
        else{
            favoritecursor.forEach(function(favoritesingle){
            if (favoritesingle.dishes.indexOf(dish._id) != -1){
                var err = new Error('This dish is already in your favorite list');
                err.status = 401;
                return next(err);
            }else{


             favoritesingle.dishes.push(dish._id);
                favoritesingle.save(function(err,favoritesingle){
                    if (err) throw err;
                    res.json(favoritesingle);
                });
            }
            
            });
            }
        });
        }
     });
 });
})
      

.delete(Verify.verifyOrdinaryUser, function(req, res, next){
    Favorites.remove({postedBy:req.decoded._doc._id}, function(err,resp){
      if (err) throw err;
          res.json(resp);
      });
    });



favoriteRouter.route('/:dishId')

    .delete(Verify.verifyOrdinaryUser, function(req, res, next){
    Favorites.find({postedBy:req.decoded._doc._id}).exec(function(err,favoritecursor){
       if (err) throw err;

       favoritecursor.forEach(function(favoritesingle){
           favoritesingle.dishes.pop(req.params.dishObjectId);
           if (favoritesingle.dishes.length >0) {
                favoritesingle.save(function(err,favoritesingle){
                if (err) throw err;
                res.json(favoritesingle);
           });

           }else{
            Favorites.remove({postedBy:req.decoded._doc._id}, function(err,resp){
            if (err) throw err;
            res.json(resp);
      }); 
     }
  });
           
  });
});

module.exports = favoriteRouter;
