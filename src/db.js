require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { timeStamp } = require('console');
var Sql = require('sequelize');

const { SQL_USER, SQL_HOST, SQL_PW } = process.env;

var sql = new Sql('recipes', SQL_USER, SQL_PW, {
	host: SQL_HOST,
	dialect: 'mssql',
	driver: 'tedious',
	options: {
		encrypt: true,
		database: 'recipes',
	},
	port: 1433,
	pool: {
		max: 5,
		min: 0,
		idle: 10000,
	},
});
const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
	.filter(
		(file) =>
			file.indexOf('.') !== 0 &&
			file !== basename &&
			file.slice(-3) === '.js'
	)
	.forEach((file) => {
		modelDefiners.push(require(path.join(__dirname, '/models', file)));
	});

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach((model) => model(sql));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sql.models);
let capsEntries = entries.map((entry) => [
	entry[0][0].toUpperCase() + entry[0].slice(1),
	entry[1],
]);
sql.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { Recipe, Diet } = sql.models;
var tablaIntermedia = sql.define('recipe_diet', {}, { timestamps: false });

// Aca vendrian las relaciones
Recipe.belongsToMany(Diet, { through: tablaIntermedia });
Diet.belongsToMany(Recipe, { through: tablaIntermedia });

module.exports = {
	...sql.models, // para poder importar los modelos así: const { Product, User } = require('./db.js');
	conn: sql, // para importart la conexión { conn } = require('./db.js');
};
