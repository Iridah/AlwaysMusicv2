// Definicion de Variables
const express = require('express');
const pg = require('pg');
const fs = require('fs');
const chalk = require('chalk');
const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'planta', // Reemplaza con tu usuario de PostgreSQL
  password: 'maceta', // Reemplaza con tu contraseña de PostgreSQL
  database: 'gestion_estudiantes', // Reemplaza con el nombre de tu base de datos
  host: 'localhost', // Reemplaza con la dirección de tu servidor PostgreSQL
  port: 5432 // Reemplaza con el puerto de tu servidor PostgreSQL
});

// Cargar mensajes de texto parametrizados desde un archivo JSON
const mensajes = JSON.parse(fs.readFileSync('./mensajes.json'));

// Modelo de datos para estudiantes (sin UUID)
class Estudiante {
  constructor(rut, nombre, curso, nivel) {
    this.rut = rut;
    this.nombre = nombre;
    this.curso = curso;
    this.nivel = nivel;
  }
}

// Funciones para crear la base de datos y la tabla de estudiantes (opcional)
async function crearBaseDeDatosTablaEstudiantes() {
  try {
    // Crear la base de datos si no existe
    await pool.query('CREATE DATABASE IF NOT EXISTS gestion_estudiantes');

    // Cambiar a la base de datos gestion_estudiantes
    await pool.query('USE gestion_estudiantes');

    // Crear la tabla de estudiantes si no existe
    const query = `
      CREATE TABLE IF NOT EXISTS estudiantes (
        rut NUMERIC(10,0) PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        curso TEXT NOT NULL,
        nivel TEXT NOT NULL
      )
    `;
    await pool.query(query);

    console.log(chalk.green(mensajes.baseDatosCreada));
  } catch (error) {
    console.error(chalk.red(mensajes.errorCrearBaseDatosTabla), error);
  }
}

// Rutas para la gestión de estudiantes
const router = express.Router();

// Crear un nuevo estudiante (palabra clave "nuevo")
router.post('/nuevo', async (req, res) => {
  const { rut, nombre, curso, nivel } = req.body;
  const nuevoEstudiante = new Estudiante(rut, nombre, curso, nivel);

  try {
    const query = `INSERT INTO estudiantes (rut, nombre, curso, nivel) VALUES ($1, $2, $3, $4)`;
    const values = [nuevoEstudiante.rut, nuevoEstudiante.nombre, nuevoEstudiante.curso, nuevoEstudiante.nivel];
    await pool.query(query, values);

    res.status(201).json({ message: mensajes.estudianteCreado });
  } catch (error) {
    console.error(chalk.red(mensajes.errorCrearEstudiante), error);
    res.status(500).json({ message: mensajes.errorInternoServidor });
  }
});

// Obtener por consola el registro de todos los estudiantes
router.get('/consulta', async (req, res) => {
    try {
        const query = 'SELECT * FROM estudiantes';
        const result = await pool.query(query);
        const estudiantes = result.rows;
    
        // Convertir el array de objetos a un array de arrays
        const estudiantesEnArrays = estudiantes.map(estudiante => {
          return Object.values(estudiante); // Extraer valores de cada objeto
        });
    
        console.log(chalk.green(mensajes.estudiantesObtenidos));
        console.table(estudiantesEnArrays); // Imprimir tabla de arrays en la consola
    
        res.status(200).json(estudiantes); // Enviar JSON al cliente con datos originales
      } catch (error) {
        console.error(chalk.red(mensajes.errorObtenerEstudiantes), error);
        res.status(500).json({ message: mensajes.errorInternoServidor });
      }
    });

// Obtener por consola el registro de un estudiante (palabra clave "rut")
router.get('/rut/:rut', async (req, res) => {
    const { rut } = req.params;
  
    try {
      const query = `SELECT * FROM estudiantes WHERE rut = $1`;
      const values = [rut];
      const result = await pool.query(query, values);
      const estudiante = result.rows[0];
  
      if (estudiante) {
        console.log(chalk.green(mensajes.estudianteEncontrado));
        console.table(estudiante); // Imprimir tabla de estudiante en la consola
  
        res.status(200).json(estudiante); // Enviar JSON al cliente
      } else {
        res.status(404).json({ message: mensajes.estudianteNoEncontrado });
      }
    } catch (error) {
      console.error(chalk.red(mensajes.errorObtenerEstudiante), error);
      res.status(500).json({ message: mensajes.errorInternoServidor });
    }
  });
  

// Función asíncrona para editar estudiantes (palabra clave "editar")
async function editarEstudiante(rut, datosActualizados) {
  try {
    const query = `
      UPDATE estudiantes
      SET nombre = $2, curso = $3, nivel = $4
      WHERE rut = $1
    `;
    const values = [datosActualizados.nombre, datosActualizados.curso, datosActualizados.nivel, rut];
    await pool.query(query, values);

    return true; // Indicar que la modificación fue exitosa
  } catch (error) {
    console.error(chalk.red(mensajes.errorEditarEstudiante), error);
    return false; // Indicar que la modificación falló
  }
}

router.put('/editar/:rut', async (req, res) => {
    const { rut } = req.params;
    const datosActualizados = req.body;
  
    const modificacionExitosa = await editarEstudiante(rut, datosActualizados);
  
    if (modificacionExitosa) {
      console.log(chalk.green(mensajes.estudianteEditado));
      res.status(200).json({ message: mensajes.estudianteEditado });
    } else {
      console.error(chalk.red(mensajes.errorEditarEstudiante));
      res.status(500).json({ message: mensajes.errorInternoServidor });
    }
  });
  

// Función asíncrona para eliminar estudiantes (palabra clave "eliminar")
  async function eliminarEstudiante(rut) {
    try {
      const query = `DELETE FROM estudiantes WHERE rut = $1`;
      const values = [rut];
      await pool.query(query, values);
  
      console.log(chalk.green(mensajes.estudianteEliminado));
  
      return true; // Indicar que la eliminación fue exitosa
    } catch (error) {
      console.error(chalk.red(mensajes.errorEliminarEstudiante), error);
      return false; // Indicar que la eliminación falló
    }
  }

  router.delete('/eliminar/:rut', async (req, res) => {
    const { rut } = req.params;
  
    const eliminacionExitosa = await eliminarEstudiante(rut);
  
    if (eliminacionExitosa) {
      res.status(200).json({ message: mensajes.estudianteEliminado });
    } else {
      res.status(500).json({ message: mensajes.errorEliminarEstudiante });
    }
  });
  