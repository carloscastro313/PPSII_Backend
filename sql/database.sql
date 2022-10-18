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