import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos Personales · Herbario Digital HEAA",
  description:
    "Política de Tratamiento de Datos Personales del Herbario Digital HEAA, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-green-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-gray-700">{children}</div>
    </section>
  )
}

export default function PoliticaDeDatosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <header className="mb-10 border-b border-gray-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Marco normativo colombiano</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          Política de Tratamiento de Datos Personales
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas concordantes. Última actualización: 25 de junio de 2026.
        </p>
      </header>

      <div className="space-y-9">
        <Section title="1. Responsable del tratamiento">
          <p>
            El <strong>Instituto Tecnológico del Putumayo (ITP)</strong>, a través del <strong>Herbario Digital HEAA</strong>,
            es el responsable del tratamiento de los datos personales recolectados mediante esta plataforma.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Entidad: Instituto Tecnológico del Putumayo</li>
            <li>Proyecto: Herbario Digital HEAA</li>
            <li>Canal de contacto y peticiones (PQRSDF): disponible en la <Link href="/contacto" className="font-semibold text-green-700 hover:underline">sección de Contacto</Link>.</li>
          </ul>
        </Section>

        <Section title="2. Finalidad del tratamiento">
          <p>Los datos personales se recolectan y tratan únicamente para las siguientes finalidades:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Gestionar el registro y la autenticación de usuarios de la plataforma.</li>
            <li>Atender peticiones, quejas, reclamos, sugerencias, denuncias y felicitaciones (PQRSDF) y dar respuesta con su respectivo radicado.</li>
            <li>Gestionar sugerencias y aportes al catálogo botánico.</li>
            <li>Contactar al titular cuando sea necesario en relación con sus solicitudes.</li>
            <li>Cumplir las obligaciones legales aplicables a una entidad pública.</li>
          </ul>
        </Section>

        <Section title="3. Datos que se recolectan">
          <p>
            Según la interacción, podemos recolectar: nombre, correo electrónico, teléfono, tipo y número de documento,
            dirección de correspondencia, ciudad y departamento, y el contenido de las solicitudes que el titular decida
            enviar. Los formularios públicos permiten, cuando aplica, el envío <strong>anónimo</strong> de PQRSDF.
          </p>
          <p>
            Las contraseñas se almacenan <strong>cifradas</strong> (hash bcrypt) y nunca en texto plano. La transmisión de la
            información se realiza sobre conexiones seguras (HTTPS/TLS).
          </p>
        </Section>

        <Section title="4. Derechos del titular (Habeas Data)">
          <p>Conforme al artículo 8 de la Ley 1581 de 2012, el titular de los datos tiene derecho a:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Conocer, actualizar y rectificar sus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones.</li>
            <li>Revocar la autorización y/o solicitar la supresión de los datos cuando no exista un deber legal de conservarlos.</li>
            <li>Acceder de forma gratuita a sus datos personales.</li>
          </ul>
        </Section>

        <Section title="5. Procedimiento para ejercer los derechos">
          <p>
            El titular puede ejercer sus derechos radicando una solicitud a través del canal de <Link href="/contacto" className="font-semibold text-green-700 hover:underline">PQRSDF</Link>,
            indicando su identificación, la descripción de los hechos y la petición concreta. La entidad dará respuesta en los
            términos legales (consultas: máximo 10 días hábiles; reclamos: máximo 15 días hábiles, prorrogables conforme a la ley).
          </p>
        </Section>

        <Section title="6. Seguridad de la información">
          <p>
            El Herbario Digital HEAA implementa medidas técnicas y administrativas razonables para proteger los datos
            personales: control de acceso basado en roles, cifrado de contraseñas, autenticación mediante tokens (JWT),
            transmisión cifrada (HTTPS) y conservación de la integridad documental mediante archivado lógico
            (los registros no se eliminan físicamente, en línea con la Ley 594 de 2000).
          </p>
        </Section>

        <Section title="7. Vigencia">
          <p>
            Esta política rige a partir de su publicación. Las bases de datos se conservarán durante el tiempo necesario para
            cumplir las finalidades descritas y las obligaciones legales aplicables. Cualquier cambio sustancial será informado
            a través de esta misma página.
          </p>
        </Section>

        <p className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          Normas de referencia: Ley 1581 de 2012, Decreto 1377 de 2013, Ley 1712 de 2014 (Transparencia y Acceso a la
          Información Pública) y Ley 594 de 2000 (Ley General de Archivos).
        </p>
      </div>
    </div>
  )
}
