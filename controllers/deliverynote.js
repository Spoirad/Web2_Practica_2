const deliverynoteModel = require("../models/deliverynote");
const { handleHttpError } = require("../utils/handleHttpError");
const { uploadToPinata } = require("../utils/handleUploadIPFS");
const PDFDocument = require("pdfkit");

const createDeliveryNote = async (req, res) => {
    try {
        const userId = req.user._id;
        const { client, project, description, materials, hours, totalCost } = req.body;

        const deliveryNote = await deliverynoteModel.create({
            user: userId,
            client,
            project,
            description,
            materials,
            hours,
            totalCost
        });

        res.status(201).json(deliveryNote);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_CREATE_DELIVERYNOTE");
    }
};

const getDeliveryNotes = async (req, res) => {
    try {
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const deliveryNotes = await deliverynoteModel.find({
            archived: false,
            $or: [
                { user: userId },
                ...(companyCIF ? [{ companyCIF: companyCIF }] : [])
            ]
        })
            .populate("client")
            .populate("project")
            .populate("user");

        res.json(deliveryNotes);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_DELIVERYNOTES");
    }
};

const getDeliveryNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const deliveryNote = await deliverynoteModel.findById(id)
            .populate("client")
            .populate("project")
            .populate("user");

        if (!deliveryNote || deliveryNote.archived) {
            return handleHttpError(res, "Albarán no encontrado o archivado", 404);
        }

        if (
            !deliveryNote.user.equals(userId) &&
            deliveryNote.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para ver este albarán", 403);
        }

        res.json(deliveryNote);
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GET_DELIVERYNOTE_BY_ID");
    }
};

const uploadSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const deliveryNote = await deliverynoteModel.findById(id);

        if (!deliveryNote || deliveryNote.archived) {
            return handleHttpError(res, "Albarán no encontrado o archivado", 404);
        }

        if (
            !deliveryNote.user.equals(userId) &&
            deliveryNote.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para firmar este albarán", 403);
        }

        if (deliveryNote.signed) {
            return handleHttpError(res, "El albarán ya está firmado", 400);
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        const ipfsUrl = await uploadToPinata(fileBuffer, fileName);

        deliveryNote.signatureUrl = ipfsUrl;
        deliveryNote.signed = true;
        await deliveryNote.save();

        res.json({ message: "Firma subida correctamente", signatureUrl: ipfsUrl });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_UPLOAD_SIGNATURE");
    }
};

const generateDeliveryNotePDF = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const deliveryNote = await deliverynoteModel.findById(id)
            .populate("client")
            .populate("project")
            .populate("user");

        if (!deliveryNote || deliveryNote.archived) {
            return handleHttpError(res, "Albarán no encontrado o archivado", 404);
        }

        if (
            !deliveryNote.user.equals(userId) &&
            deliveryNote.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para ver este albarán", 403);
        }

        // ✅ Crear PDF
        const doc = new PDFDocument();

        // Configurar cabecera HTTP para descargar el PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="deliverynote_${id}.pdf"`);

        // Conectar el PDF con la respuesta
        doc.pipe(res);

        // Título principal
        doc.fontSize(20).text("ALBARÁN DE ENTREGA", { align: "center" });
        doc.moveDown(2);

        // Datos generales
        doc.fontSize(12).text(`Usuario: ${deliveryNote.user.email}`);
        doc.text(`Cliente: ${deliveryNote.client.name}`);
        doc.text(`Proyecto: ${deliveryNote.project.name}`);
        doc.text(`Descripción: ${deliveryNote.description || "-"}`);
        doc.moveDown();

        // Materiales
        if (deliveryNote.materials.length > 0) {
            doc.fontSize(16).text("Materiales:");
            deliveryNote.materials.forEach(material => {
                doc.fontSize(12).text(`- ${material.quantity} ${material.unit} de ${material.description} (${material.price}€/unidad)`);
            });
            doc.moveDown();
        }

        // Horas
        if (deliveryNote.hours.length > 0) {
            doc.fontSize(16).text("Horas de trabajo:");
            deliveryNote.hours.forEach(hour => {
                doc.fontSize(12).text(`- ${hour.worker}: ${hour.hours} horas a ${hour.pricePerHour}€/hora`);
            });
            doc.moveDown();
        }

        // Coste total
        doc.fontSize(16).text(`Coste Total: ${deliveryNote.totalCost || 0} €`);
        doc.moveDown(2);

        // Firma (si existe)
        if (deliveryNote.signed && deliveryNote.signatureUrl) {
            doc.fontSize(16).text("Firma del cliente:", { align: "left" });
            try {
                const imageUrl = deliveryNote.signatureUrl;
                const response = await fetch(imageUrl);
                const arrayBuffer = await response.arrayBuffer();
                const imageBuffer = Buffer.from(arrayBuffer);

                doc.image(imageBuffer, { width: 200, align: "center" });
            } catch (error) {
                console.error("Error cargando imagen de firma:", error);
                doc.fontSize(12).text("Firma no disponible.");
            }
        } else {
            doc.fontSize(12).text("No firmado.");
        }

        // Finalizar PDF
        doc.end();
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_GENERATE_DELIVERYNOTE_PDF");
    }
};

const deleteDeliveryNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const companyCIF = req.user.company?.cif || null;

        const deliveryNote = await deliverynoteModel.findById(id);

        if (!deliveryNote) {
            return handleHttpError(res, "Albarán no encontrado", 404);
        }

        if (
            !deliveryNote.user.equals(userId) &&
            deliveryNote.companyCIF !== companyCIF
        ) {
            return handleHttpError(res, "No autorizado para eliminar este albarán", 403);
        }

        if (deliveryNote.signed) {
            return handleHttpError(res, "No se puede borrar un albarán firmado", 400);
        }

        await deliverynoteModel.findByIdAndDelete(id);

        res.json({ message: "Albarán eliminado correctamente" });
    } catch (e) {
        console.error(e);
        handleHttpError(res, "ERROR_DELETE_DELIVERYNOTE");
    }
};


module.exports = { createDeliveryNote, getDeliveryNotes, getDeliveryNoteById, uploadSignature, generateDeliveryNotePDF, deleteDeliveryNote };
