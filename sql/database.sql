CREATE DATABASE PPSII

CREATE TABLE TipoUsuario(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100) NOT NULL
);

INSERT INTO TipoUsuario(Descripcion) VALUES ('Administracion');
INSERT INTO TipoUsuario(Descripcion) VALUES ('Secretaria');
INSERT INTO TipoUsuario(Descripcion) VALUES ('Docente');
INSERT INTO TipoUsuario(Descripcion) VALUES ('Alumno');

CREATE TABLE Usuarios(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    TipoUsuario INT(4) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    DNI VARCHAR(10) NOT NULL,
    Mail VARCHAR(100) NOT NULL,
    Contraseña VARCHAR(100) NOT NULL,
    CONSTRAINT FK_TipoUsuario FOREIGN KEY (TipoUsuario) REFERENCES TipoUsuario(Id)
);

CREATE TABLE Avisos(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Mensaje VARCHAR(2000) NOT NULL,
    Titulo VARCHAR(100) NOT NULL,
    IdEmisor INT(11) NOT NULL,
    CONSTRAINT FK_IdEmisor FOREIGN KEY (IdEmisor) REFERENCES Usuarios(Id)
);

CREATE TABLE AvisoUsuarios(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    IdUsuario INT(11) NOT NULL,
    IdAviso INT(11) NOT NULL,
    Leido BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_IdUsuario FOREIGN KEY (IdUsuario) REFERENCES Usuarios(Id),
    CONSTRAINT FK_IdAviso FOREIGN KEY (IdAviso) REFERENCES Avisos(Id)
);

CREATE TABLE Carrera(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    PlanActual VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(100) NOT NULL,
    Estado BIT NOT NULL DEFAULT 1
);

CREATE TABLE EstadoAlumnoCarrera(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100) NOT NULL
);

INSERT INTO EstadoAlumnoCarrera(Descripcion) VALUES ('En curso');
INSERT INTO EstadoAlumnoCarrera(Descripcion) VALUES ('Graduado');

CREATE TABLE AlumnoCarrera(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    IdAlumno INT(11) NOT NULL,
    IdCarrera INT(11) NOT NULL,
    IdEstadoCarrera INT(11) NOT NULL,
    CONSTRAINT FK_IdAlumno FOREIGN KEY (IdAlumno) REFERENCES Usuarios(Id),
    CONSTRAINT FK_IdCarrera FOREIGN KEY (IdCarrera) REFERENCES Carrera(Id),
    CONSTRAINT FK_IdEstadoCarrera FOREIGN KEY (IdEstadoCarrera) REFERENCES EstadoAlumnoCarrera(Id)
);

CREATE TABLE PlanEstudio(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    IdCarrera INT(11) NOT NULL,
    FechaCreacion DATETIME NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Duracion INT(11) NOT NULL,
    CONSTRAINT FK_IdCarreraPlan FOREIGN KEY (IdCarrera) REFERENCES Carrera(
);

CREATE TABLE Materia(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Correlativa(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    IdMateria INT(11) NOT NULL,
    IdCorrelativa INT(11) NOT NULL,
    CONSTRAINT FK_IdMateria FOREIGN KEY (IdMateria) REFERENCES Materia(Id),
    CONSTRAINT FK_IdCorrelativa FOREIGN KEY (IdCorrelativa) REFERENCES Materia(Id)
);

CREATE TABLE EstadoAcademico(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100) NOT NULL
);

INSERT INTO EstadoAcademico(Descripcion) VALUES ('No cursada');
INSERT INTO EstadoAcademico(Descripcion) VALUES ('Cursada Regular');
INSERT INTO EstadoAcademico(Descripcion) VALUES ('Cursada Aprobada');
INSERT INTO EstadoAcademico(Descripcion) VALUES ('Materia Desaprobada');
INSERT INTO EstadoAcademico(Descripcion) VALUES ('Materia Aprobada');

CREATE TABLE TipoInstanciaInscripcion(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100) NOT NULL
);

INSERT INTO TipoInstanciaInscripcion(Descripcion) VALUES ('Final');
INSERT INTO TipoInstanciaInscripcion(Descripcion) VALUES ('Materia');

CREATE TABLE InstanciaInscripcion(
    Id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    FechaInicio DATETIME NOT NULL,
    FechaFinal DATETIME NOT NULL,
    Cuatrimestre VARCHAR(100) NOT NULL,
    Año VARCHAR(100) NOT NULL,
    IdTipo INT(11) NOT NULL,
    CONSTRAINT FK_IdTipo FOREIGN KEY (IdTipo) REFERENCES TipoInstanciaInscripcion(Id)
);