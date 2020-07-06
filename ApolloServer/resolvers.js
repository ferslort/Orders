const Company = require('../models/Company');
const User = require('../models/Users');
const Dish = require('../models/Dish');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const moment = require('moment');
import bcryptjs from 'bcryptjs';
const jwt = require('jsonwebtoken');
import cloudinary from 'cloudinary'
import shortid from "shortid";
import { createWriteStream, mkdir } from "fs";
import fs from 'fs-extra';
require('dotenv').config();


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRECT
})

const storeUpload = async ({ stream, filename, mimetype }) => {
  const id = shortid.generate();
  const path = `images/${id}-${filename}`;

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on("finish", () => resolve({ id, path, filename, mimetype }))
      .on("error", reject)
  );
};

const processUpload = async upload => {
  const { createReadStream, filename, mimetype } = await upload;
  const stream = createReadStream();
  const file = await storeUpload({ stream, filename, mimetype });
  return file;
};

const generateToken = async (payload) =>{
    return  jwt.sign(payload, process.env.KEY_SECRECT, {expiresIn: '8h'})
}


const resolvers = {
  //-------------------------------------- Query ---------------------------------------------
  Query: {
    //------------------------ USUARIOS -----------------------
    getUser: async (_, { token }) => {
      let user = await jwt.verify(token, process.env.KEY_SECRECT);
      return user;
    },
    //----------- Obtener todos los usuario -------------
    getUsers: async (_, {}, ctx) => {
      const { id, rol, company } = ctx.Company;
      //verificar si el usuario es admin
      let user = await User.findById({ _id: id, rol: "ADMIN" });
      if (!user) throw new Error("Acceso denegado");
      let users = await User.find({ company, delete: false });
      return users;
    },
    //----------- Obtener un usuario por su id -------------
    getUserID: async (_, { id }, ctx) => {
      //verificar si la orden existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es la empresa creador
      if (user.company.toString() !== ctx.Company.company)
        throw new Error("No puedes actualizar");

      //verificar si es admin de la empresa
      if (ctx.Company.rol !== "ADMIN") throw new Error("No puedes actualizar");

      return user;
    },

    //------------------------ PRODUCTOs -----------------------
    getProducts: async (_, {}, ctx) => {
      const { id, company } = ctx.Company;

      //Verificar si es usuario admin
      let user = await User.findOne({ _id: id, rol: "ADMIN" });
      if (!user) throw new Error("Acceso denegado");

      let products = await Product.find({ company, delete: false });

      return products;
    },
    //----------- obtener un p´roducto por id -------------
    getProductID: async (_, { id }, ctx) => {
      const { company } = ctx.Company;
      //verificar si la orden existe

      let user = await User.findById(ctx.Company.id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es la empresa creador
      if (user.company.toString() !== company)
        throw new Error("Acceso denegado");

      //verificar si es admin de la empresa
      if (ctx.Company.rol !== "ADMIN") throw new Error("Acceso denegado");

      //verificar el producto
      let product = await Product.findOne({ _id: id, delete: false });
      if (!product) throw new Error("El producto no existe");

      if (product.company.toString() !== company)
        throw new Error("Acceso denegado");

      return product;
    },

    //------------------------  PLATOS -----------------------
    getDish: async (_, {}, ctx) => {
      const { id, company } = ctx.Company;


      let dish = await Dish.find({ company, delete: false, active: true });
      return dish;
    },
    //----------- obtenerl el plato por id -------------
    getDishId: async (_, { id }, ctx) => {
      const { company } = ctx.Company;
      //verificar si la orden existe

      let user = await User.findById(ctx.Company.id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es la empresa creador
      if (user.company.toString() !== company)
        throw new Error("Acceso denegado");

      //verificar si es admin de la empresa
      if (ctx.Company.rol !== "ADMIN") throw new Error("Acceso denegado");

      //verificar el plato
      let dish = await Dish.findById(id);
      if (!dish) throw new Error("El plato no existe");

      return dish;
    },

    //------------------------ ORDENES -----------------------
    getOrders: async (_, {}, ctx) => {
      //Verificar si es usuario admin
      let user = await User.findOne({ _id: ctx.Company.id});
   
      if (!user) throw new Error("Acceso denegado");
    

      //obtener las ordenes de la empresa
      let orders = await Order.find({
        company: ctx.Company.company,
        delete: false,
      })
        .populate("user")
        .sort({ registration: -1 , status: -1});
      return orders;
    },

    getOrderTotal: async (_, {}, ctx) => {
      const { id, company } = ctx.Company;
      //verificar si la orden existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //obtener las ordenes de la emprea
      let order = await Order.aggregate([
        {$project:{
          registration: 1,
          total: 1,
          _id: 0,
          paid: 1
        }

        },
        {
          $match: {
            paid: true,
            company: new mongoose.Types.ObjectId(company)
          },
        },
        {
          $group: {
            _id: "$user",
            total: { $sum: "$total" },
          },
        },
        {
          $sort: {
            registration: 1,
          },
        },
      ]);

      try {
        return order;
      } catch (error) {
        console.log(error);
      }
      return order;
    },

    //----------- obtener ordenes por id -------------
    getOrderID: async (_, { id }, ctx) => {
      const { company } = ctx.Company;
      //verificar si la orden existe

      let user = await User.findById(ctx.Company.id);
      if (!user) throw new Error("El usuario no existe");

      //obtener las ordenes de la emprea
      let order = await Order.findById({
        _id: id,
        company,
        delete: false,
      }).populate("user");

      //verificar si es la empresa creador
      if (order.company.toString() !== company)
        throw new Error("Acceso denegado");

      if (!order) throw new Error("La orden no existe");
      return order;
    },

    //----------- obtener ordenes por usuario -------------
    getOrderUser: async (_, {}, ctx) => {
      const { id } = ctx.Company;
      //verificar si la orden existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      const hoy = Number(moment().format("DDD"));

      //obtener las ordenes de la emprea
      let order = await Order.aggregate([
        { $project:{
            delete: 1,
            user: 1,
            company: 1,
            detail: 1,
            registration: 1,
            registro: {$dayOfYear: "$registration"},
            typeOrder: 1,
            pedido: 1,
            status: 1,
            shortId: 1,
            total: 1,
            id: "$_id"
          }
        },
        {$match:{
            delete: false,
            user: new mongoose.Types.ObjectId(id),
            status: {$in: ['PREPARANDO', 'PENDIENTE', 'LISTO']},
            registro: hoy
          }
        },
        {
          $sort:{
            registration : 1
          }
        }
      ])
     
      return order;
    },
    
    //----------- obtener ordenes por usuario -------------
    getOrderUserReady: async (_, {}, ctx) => {
      const { id } = ctx.Company;
      //verificar si la orden existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      const hoy = Number(moment().format("DDD"));

      //obtener las ordenes de la emprea
      let order = await Order.aggregate([
        { $project:{
            delete: 1,
            user: 1,
            company: 1,
            detail: 1,
            registration: 1,
            registro: {$dayOfYear: "$registration"},
            typeOrder: 1,
            pedido: 1,
            status: 1,
            shortId: 1,
            total: 1,
            _id: 1
          }
        },
        {$match:{
            delete: false,
            user: new mongoose.Types.ObjectId(id),
            status: 'LISTO',
            registro: hoy
          }
        },
        {
          $sort:{
            registration : 1
          }
        }
      ])
      console.log(order)
      return order;
    },

    //obtener las ordenes por pagar
    getOrdersPaid: async (_, {}, ctx) => {
      const { id, company } = ctx.Company;
      //verificar si la orden existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //obtener las ordenes de la emprea
      let order = await Order.find({delete: false, company, paid: false}).sort({registration: -1})
   
      return order;
    },

      getReadyOrder: async(_, {}, ctx) =>{
        const { id } = ctx.Company;
        //verificar si la orden existe
        let user = await User.findById(id);
        if (!user) throw new Error("El usuario no existe");
  
        const hoy = Number(moment().format("DDD"));
  
        //obtener las ordenes de la emprea
        let order = await Order.aggregate([
          { $project:{
              delete: 1,
              user: 1,
              company: 1,
              detail: 1,
              registration: 1,
              registro: {$dayOfYear: "$registration"},
              typeOrder: 1,
              _id: 0,
              pedido: 1,
              status: 1,
              shortId: 1,
              total: 1
            }
          },
          {$match:{
              delete: false,
              user: new mongoose.Types.ObjectId(id),
              status: {$in: ['LISTO']},
              registro: hoy
            }
          },
          {
            $sort:{
              registration : 1
            }
          }
        ])
     
        return order;
    },
  


    // ----------- obtener ordenes por usuario -------------
    getOrderStatus: async (_, {}, ctx) => {
      const { id, company, rol } = ctx.Company;

      //Verificar si es usuario admin o cocina
      if (rol === "ADMIN" || rol === "cocina") {
        let user = await User.findOne({ _id: id, rol: "ADMIN" });
        if (!user) throw new Error("Acceso denegado");
  
        let order = await Order.aggregate([
          {
            $match: {
              company
            },
          },
        ]);
       
        return order;
      }
    },
    //------------------------ Otros Resultado -----------------------
    ventasUser: async (_, {}, ctx) => {
      let order = await Order.aggregate([
        {
          $match: { status: "completado" },
        },
        {
          $group: { _id: "$user", total: { $sum: "$total" } },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ]);
      return order;
    },

    ventasTotal: async (_, {}, ctx) => {
      const { company } = ctx.Company;
      const now = Date.now();
      const year = moment(now).format("Y");

      let order = await Order.aggregate([
        {
          $project: {
            total: 1,
            paid: 1,
            delete: 1,
            _id: 0,
            company: 1,
            year: year,
            registration: 1,
            registro: {
              $dateToString: { format: "%Y", date: "$registration" },
            },
          },
        },

        {
          $match: {
            delete: false,
            paid: true,
            company: new mongoose.Types.ObjectId(company),
            registro: year,
          },
        },
        {
          $group: {
            _id: "$year",
            total: { $sum: "$total" },
          },
        },
      ]);
      return order;
    },

    ventasMes: async (_, {}, ctx) => {
      const { company } = ctx.Company;
      let mes = moment().format("MM");
      const year = Number(moment().format("Y"));

      let order = await Order.aggregate([
        {
          $project: {
            company: 1,
            delete: 1,
            paid: 1,
            status: 1,
            registroYear: {
              $year: {date: "$registration", timezone: "-0400"} 
            },
            registroMonth: {
              $month: {date: "$registration", timezone: "-0400"}
            },
            month: {$toInt: mes},
            total: 1,
            _id: 0,
          },
        },

        {
          $match: {
            company: new mongoose.Types.ObjectId(company),
            delete: false,
            paid: true,
            registroYear: year,
          },
        },
        {
          $group: {
            _id: "$registroMonth",
            total: { $sum: "$total" },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);
  
      return order;
    },

    ventasDias: async (_, {}, ctx) => {
      const { company } = ctx.Company;

      const hoy = Number(moment().format("DDD"));
      let order = await Order.aggregate([
        {
          $project: {
            status: 1,
            company: 1,
            paid: 1,
            delete: 1,
            registration: {$dayOfYear: "$registration" },
            total: 1,
            _id: 0,
  
          },
        },
        {
          $match: {
            delete: false,
            paid: true,
            company: new mongoose.Types.ObjectId(company),
            registration: hoy,
          },
        },
        {
          $group: {
            _id: "$company",
            total: { $sum: "$total" },
          },
        },
      ]);
     
      return order;
    },

    tipoOrder: async (_, {}, ctx) => {
      const { company } = ctx.Company;

      let order = await Order.aggregate([
        {
          $project: {
            delete: 1,
            _id: 0,
            typeOrder: 1,
            company: 1,
          },
        },
        {
          $match: {
            delete: false,
            company: new mongoose.Types.ObjectId(company),
          },
        },
        {
          $group: {
            _id: "$typeOrder",
            count: { $sum: 1 },
          },
        },
      ]);
      return order;
    },

    statusOrder: async (_, { status }, ctx) => {
      const { company } = ctx.Company;
      let order = await Order.aggregate([
        {
          $match: {
            delete: false,
            company: new mongoose.Types.ObjectId(company),
            status,
          },
        },
        { $count: "count" },
      ]);
      return order;
    },

    statusOrderDay: async(_, {}, ctx) =>{
      const {company} = ctx.Company;

      let day = Number(moment().format('DDDD'));

      let order = await Order.aggregate([

        { $project:{
            company: 1,
            status: 1,
            delete: 1,
            paid: 1,
            registration: 1,
            _id: 0,
            registroDay: {$dayOfYear: "$registration" }
          }
        },
        { $match:{
          delete: false,
          paid: true,
          company: new mongoose.Types.ObjectId(company),
          registroDay: day
        }
        },
        { $count: "count" },
      ])

      return order;
   
    }
  },

  //----------- ------------------------  Mutation -------------------------------------------------
  Mutation: {


    //------------------------ EMPRESAS -----------------------

    createCompany: async (_, { input }) => {
      const { email, idcompany } = input;

      //verificar si el email o idcompany se encuentran registrado
      let company = await Company.findOne({ email, idcompany });
      if (company) throw new Error("El usuario ya se encuentra registrado");

      //crear la empresa
      let newCompany = await new Company(input);

      try {
        //guardar el usuario en la base de datos
        await newCompany.save();
        return newCompany;
      } catch (error) {
        console.log(error);
      }
    },

    //------------------------  USUARIOS  -----------------------
    //----------- crear Usuario -------------
    createUser: async (_, { input, file}, ctx) => {

      const { filename, createReadStream } = await file
      const { email, password } = input;

      //verificar si el usuario ya existe
      let user = await User.findOne({ email });
      if (user) throw new Error("El usuario ya existe");

      //hashear el password
      const salt = await bcryptjs.genSalt(10);
      input.password = await bcryptjs.hash(password, salt);

      input.company = ctx.Company.company;

       //avatar
       if (file) {
        
        mkdir("images", { recursive: true }, err => {
          if (err) throw err;
        });

        const upload = await processUpload(file);
        const newfile = await cloudinary.v2.uploader.upload(upload.path);
        await fs.unlink(upload.path)
        input.avatar = newfile.secure_url
      }
  

      //crear el usuario
      let newUser = await new User(input);
      await newUser.save();
      return newUser;
    },

    //----------- autenticar Usuario -------------

    authUser: async (_, { input }) => {
      const { email, password } = input;

      //verificar si el usuario existe
      let user = await User.findOne({ email });
      if (!user) throw new Error("El usuario no esta registrado");

      //verificar el password
      const verify = await bcryptjs.compare(password, user.password);
      if (!verify) throw new Error("El password es incorrecto");

      //verificar su el usuario esta activo
      if (!user.active || user.delete)
        throw new Error("El usuario no se encuentra activo");

      //verificar si la empresa se encuentra activa
      let companyVery = await Company.findOne({
        _id: user.company,
        active: true,
      });

      if (!companyVery)
        throw new Error("La empresa o tienda no se encuentra activa");

      //generar y firmar el token
      const payload = {
        Company: {
          id: user._id,
          name: user.name,
          company: user.company,
          rol: user.rol,
          avatar: user.avatar
        },
      };

      return {
        token: generateToken(payload),
      };
    },

    //----------- eliminar Usuario -------------
    deteleUser: async (_, { id }, ctx) => {
      //verificar el usuario existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        //actualizar el campo detele para mantener el registro de usuarios
        await User.findByIdAndUpdate(
          { _id: id },
          { delete: true },
          { new: true }
        );
        return "Usuario Eliminado";
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar Usuario -------------
    updateUser: async (_, { id, input, file }, ctx) => {
    
      //verificar si el usuario existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      //actualizar contraseña
      if (input.password) {
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(input.password, salt);
      }

      if (file) {
        
        mkdir("images", { recursive: true }, err => {
          if (err) throw err;
        });
        const upload = await processUpload(file);
        const newfile = await cloudinary.v2.uploader.upload(upload.path);
        await fs.unlink(upload.path)
        input.avatar = newfile.secure_url
      }
  
      //actualizar el usuario
      try {
        let userUpdate = await User.findByIdAndUpdate({ _id: id }, input, {
          new: true,
        });
        return userUpdate;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar estado del usuario -------------
    updateActiveUser: async (_, { id }, ctx) => {
      //verificar si el usuario existe
      let user = await User.findById(id);
      if (!user) throw new Error("El usuario no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      //actualizar el usuario
      try {
        let userUpdate = await User.findByIdAndUpdate(
          { _id: id },
          { active: !user.active },
          { new: true }
        );
        return userUpdate;
      } catch (error) {
        console.log(error);
      }
    },

    //------------------------ PRODUCTOS -----------------------
    createProduct: async (_, { input, }, ctx) => {
      //crear el producto
      let product = await new Product(input);

      //insertar la empresa al producto
      product.company = ctx.Company.company;

      try {
        //guarfar el producto
        await product.save();
        return product;
      } catch (error) {
        console.log(error);
      }
    },
    //----------- eliminar Usuario -------------
    deleteProduct: async (_, { id }, ctx) => {
      //verificar si el producto existe
      let product = await Product.findById(id);
      if (!product) throw new Error("El producto no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        await Product.findByIdAndRemove({ _id: id });
        return `${product.name} fue eliminado`;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar stock producto -------------
    updateProduct: async (_, { id, input }, ctx) => {
      //verificar si el producto existe
      let product = await Product.findById(id);
      if (!product) throw new Error("El producto no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        //actualizar el producto
        const productUpdate = await Product.findByIdAndUpdate(
          { _id: id },
          input,
          { new: true }
        );
        return productUpdate;
      } catch (error) {
        console.log(error);
      }
    },

    //------------------------ PLATOS -----------------------
    createDish: async (_, { input, file }, ctx) => {
      let dish = await new Dish(input);
      //verificar y asigar empresa al plato
      let company = await Company.findById(ctx.Company.company);
      if (!company) throw new Error("La empresa no existe");
      dish.company = ctx.Company.company;

      if (file) {
        
        mkdir("images", { recursive: true }, err => {
          if (err) throw err;
        });
        const upload = await processUpload(file);
        const newfile = await cloudinary.v2.uploader.upload(upload.path);
        await fs.unlink(upload.path)
        dish.avatar = newfile.secure_url
      }


      try {
        //guardar el plato
        await dish.save();
        return dish;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- eliminar plato  -------------
    deleteDish: async (_, { id }, ctx) => {
      //verificar si el plato existe
      let dish = await Dish.findById(id);
      if (!dish) throw new Error("El plato no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        const deleteDish = await Dish.findByIdAndUpdate(
          { _id: id },
          { delete: true },
          { new: true }
        );
        return deleteDish;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar plato  -------------
    updateDish: async (_, { id, input, file }, ctx) => {
      //verificar si el plato existe
      let dish = await Dish.findById(id);
      if (!dish) {
        throw new Error("El plato no existe");
      } else if (!dish.active) {
        throw new Error(
          "El plato esta desactivado, debes activarlo para editarlo."
        );
      }
      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
        company: ctx.Company.company,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      if (file) {
        
        mkdir("images", { recursive: true }, err => {
          if (err) throw err;
        });
        const upload = await processUpload(file);
        const newfile = await cloudinary.v2.uploader.upload(upload.path);
        await fs.unlink(upload.path)
        input.avatar = newfile.secure_url
      }


      try {
        //actualizar el plato
        const dishUpdate = await Dish.findByIdAndUpdate({ _id: id }, input, {
          new: true,
        });
        return dishUpdate;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar plato  -------------
    updateStateDish: async (_, { id }, ctx) => {
      //verificar si el plato existe
      let dish = await Dish.findById(id);
      if (!dish) throw new Error("El plato no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        //actualizar el plato
        const dishUpdate = await Dish.findByIdAndUpdate(
          { _id: id },
          { active: !dish.active },
          { new: true }
        );
        return dishUpdate;
      } catch (error) {
        console.log(error);
      }
    },

    //------------------------ ORDENES -----------------------
    createOrder: async (_, { input }, ctx) => {
      //verificar si el usuario existe
      let user = await User.findById(ctx.Company.id);
      if (!user) throw new Error("Acceso denegado");

      //Verificar si la empresa existe
      let company = await Company.findById(ctx.Company.company);
      if (!company) throw new Error("Acceso denegado");

      //asignar usuario a la orden
      input.user = ctx.Company.id;

      //asinar empresa a la order
      input.company = ctx.Company.company;

      //asignar un numero de order
      input.shortId = shortid.generate();

      try {
        let order = await new Order(input);
        //guardar la orden
        await order.save();
        return order;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- eliminar orden  -------------
    deleteOrder: async (_, { id }, ctx) => {
      const { company } = ctx.Company;

      //verificar si la orden existe
      let order = await Order.findById(id);
      if (!order) throw new Error("La orden no existe");

      //verificar si es admin de la tienda
      let userAdmin = await User.findOne({
        _id: ctx.Company.id,
        rol: "ADMIN",
        delete: false,
        company,
      });
      if (!userAdmin) throw new Error("Acceso denegado");

      try {
        //actualizar el estado de la orden para no eliminarlo
        await Order.findByIdAndUpdate(
          { _id: id },
          { delete: true },
          { new: true }
        );
        return order;
      } catch (error) {
        console.log(error);
      }
    },

    //----------- actualizar orden  -------------
    updateOrder: async (_, { id, input }, ctx) => {
      //verificar si la orden existe
      let order = await Order.findById(id);
      if (!order) throw new Error("La orden no existe");
      //verificar si el admin y si pertenece a la misma

      let user = await User.findById(ctx.Company.id);

      if (
        ctx.Company.id !== order.user.toString() &&
        ctx.Company.rol !== "ADMIN"
      ) {
        throw new Error("No puedes actualizar");
      }

      //verificar si el producto se encuentra cons status stock
      for await (const articulo of input.pedido) {
        const { id } = articulo;
        //validar si existe el producto
        let producto = await Product.findById(id);

        if (producto.inventary) {
          if (articulo.qly > producto.qly) {
            throw new Error(
              `La cantidad solicitada de ${producto.name} excede al disponible.`
            );
          } else {
            producto.qly = producto.qly - articulo.qly;
            await producto.save();
          }
        }
      }
      try {
        await Order.findByIdAndUpdate({ _id: id }, input, { new: true });
        return order;
      } catch (error) {
        console.log(error);
      }
    },

    updateStatusOrder: async (_, { id, status }, ctx) => {
      //verificar si la orden existe
      let order = await Order.findById(id);
      if (!order) throw new Error("La orden no existe");
      //verificar si el admin y si pertenece a la misma

      let user = await User.findById(ctx.Company.id);

      if (
        ctx.Company.id !== order.user.toString() &&
        ctx.Company.rol !== "ADMIN" &&
        ctx.Company.rol !== "COCINA"
      ) {
        throw new Error("No puedes actualizar");
      }

      try {
        order = await Order.findByIdAndUpdate(
          { _id: id },
          { status },
          { new: true }
        );
        return order;
      } catch (error) {
        console.log(error);
      }
    },

    updatePaidOrder: async (_, {id}, ctx) =>{
        //verificar si la orden existe
      let order = await Order.findById(id);
      if (!order) throw new Error("La orden no existe");
      //verificar si el admin y si pertenece a la misma

      let user = await User.findById(ctx.Company.id);

      if (
        ctx.Company.id !== order.user.toString() &&
        ctx.Company.rol !== "ADMIN"
      ) {
        throw new Error("No puedes actualizar");
      }

      try {
        order = await Order.findByIdAndUpdate(
          { _id: id },
          { paid: true },
          { new: true }
        );
        return order;
      } catch (error) {
        console.log(error);
      }
    }
  },
};

module.exports = resolvers;