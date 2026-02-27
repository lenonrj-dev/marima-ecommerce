"use client";

import { Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  fadeInUp,
  imageReveal,
  slideInLeft,
  slideInRight,
  staggerContainer,
  textReveal,
  useMotionSafeProps,
} from "../animations";
import Container from "../ui/Container";
import Button from "../ui/Button";

export function InstagramStrip() {
  const motionSafe = useMotionSafeProps();
  const enableMotion = motionSafe?.initial !== false;

  const desktopGallery = useMemo(
    () =>
      [
        {
          key: "grid-topmin-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165868/Grid_topmin_blw2mm.png",
          alt: "",
        },
        {
          key: "grid-topbottom2-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165725/Grid_TopBottom2_ds7arq.png",
          alt: "",
        },
        {
          key: "grid-left-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771164881/Grid_Esquerda_xhuchi.png",
          alt: "",
        },
        {
          key: "grid-center-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771164699/Grid_Centro_l0m5pl.png",
          alt: "Destaque central do Instagram",
        },
        {
          key: "grid-right-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165359/Grid_Direito_lycfv4.png",
          alt: "",
        },
        {
          key: "grid-min-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771166027/Gridmin_saufgq.png",
          alt: "",
        },
        {
          key: "grid-topbottom-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165467/Grid_TopBottom_z1hrgj.png",
          alt: "",
        },
        {
          key: "grid-minb-desktop",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771166202/Gridminb_az313z.png",
          alt: "",
        },
      ] as const,
    [],
  );

  const mobileGallery = useMemo(
    () =>
      [
        {
          key: "grid-topmin-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771008815/Regata_Preta_1_w6fm0h.png",
          alt: "Destaque Marima — look 1",
        },
        {
          key: "grid-topbottom2-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165725/Grid_TopBottom2_ds7arq.png",
          alt: "Destaque Marima — look 2",
        },
        {
          key: "grid-left-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771164881/Grid_Esquerda_xhuchi.png",
          alt: "Destaque Marima — look 3",
        },
        {
          key: "grid-center-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771164699/Grid_Centro_l0m5pl.png",
          alt: "Destaque Marima — look 4",
        },
        {
          key: "grid-right-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165359/Grid_Direito_lycfv4.png",
          alt: "Destaque Marima — look 5",
        },
        {
          key: "grid-min-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771008448/Regata_Cinza_4_dwkyii.png",
          alt: "Destaque Marima — look 6",
        },
        {
          key: "grid-topbottom-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771165467/Grid_TopBottom_z1hrgj.png",
          alt: "Destaque Marima — look 7",
        },
        {
          key: "grid-minb-mobile",
          src: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771009828/Croped_Branco_1_woizhp.png",
          alt: "Destaque Marima — look 8",
        },
      ] as const,
    [],
  );

  return (
    <motion.section
      {...(enableMotion ? motionSafe : {})}
      id="instagram"
      className="bg-body mt-20 py-12 scroll-mt-20 sm:py-16 lg:py-20"
      variants={enableMotion ? staggerContainer(0.08) : undefined}
      initial={false}
      whileInView={enableMotion ? "show" : undefined}
      viewport={enableMotion ? { once: true, amount: 0.25 } : undefined}
    >
      <Container className="space-y-12 sm:space-y-16">
        <motion.div className="flex justify-center" variants={enableMotion ? slideInRight() : undefined}>
          <div className="relative hidden h-[560px] w-full max-w-[1100px] lg:block">
            <motion.div
              className="absolute left-[427px] top-[-30px] h-[120px] w-[120px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal() : undefined}
            >
              <img src={desktopGallery[0].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[565px] top-[-100px] h-[190px] w-[180px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.04) : undefined}
            >
              <img src={desktopGallery[1].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[15%] top-[22%] h-[220px] w-[200px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.08) : undefined}
            >
              <img src={desktopGallery[2].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[35%] top-[18%] h-[340px] w-[360px] overflow-hidden"
              variants={enableMotion ? imageReveal(0.1) : undefined}
            >
              <img
                src={desktopGallery[3].src}
                alt={desktopGallery[3].alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[221px] h-[220px] w-[220px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.12) : undefined}
            >
              <img src={desktopGallery[4].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[24%] flex h-14 w-14 items-center justify-center bg-[#111111] text-white"
              variants={enableMotion ? fadeInUp(0.14) : undefined}
            >
              <Instagram className="h-6 w-6" strokeWidth={1.6} />
            </motion.div>

            <motion.div
              className="absolute left-[25%] top-[62%] h-[90px] w-[90px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.16) : undefined}
            >
              <img src={desktopGallery[5].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[82%] h-[140px] w-[150px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.18) : undefined}
            >
              <img src={desktopGallery[6].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>

            <motion.div
              className="absolute left-[645px] top-[82%] h-[100px] w-[100px] overflow-hidden"
              aria-hidden
              variants={enableMotion ? imageReveal(0.2) : undefined}
            >
              <img src={desktopGallery[7].src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </motion.div>
          </div>

          <motion.div
            className="grid w-full max-w-[740px] grid-cols-2 gap-4 sm:grid-cols-3 lg:hidden"
            variants={enableMotion ? slideInLeft() : undefined}
          >
            {mobileGallery.map((item, idx) => (
              <motion.div
                key={item.key}
                className="group relative overflow-hidden rounded-2xl ring-1 ring-black/10"
                variants={enableMotion ? imageReveal(0.04 * idx) : undefined}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ aspectRatio: "3 / 4" }}
                />
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-black/5" aria-hidden />
                </div>
              </motion.div>
            ))}

            <motion.div
              className="col-span-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-black/10 backdrop-blur-md sm:col-span-3"
              variants={enableMotion ? fadeInUp(0.08) : undefined}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-white">
                  <Instagram className="h-4.5 w-4.5" strokeWidth={1.6} />
                </span>
                <p className="text-xs font-semibold text-[#111111]">@use.marima.ofc</p>
              </div>
              <span className="text-[11px] font-semibold text-[#111111]/70">Abrir no Instagram</span>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div className="max-w-2xl space-y-4" variants={enableMotion ? slideInLeft(0.1) : undefined}>
          <motion.span className="text-[11px] uppercase tracking-[0.25em] text-muted" variants={enableMotion ? textReveal() : undefined}>
            Instagram
          </motion.span>
          <motion.h3
            className="font-serif text-3xl leading-tight text-[#111111] sm:text-4xl"
            variants={enableMotion ? fadeInUp(0.06) : undefined}
          >
            Siga-nos <span className="italic text-primary">@use.marima.ofc</span>
          </motion.h3>
          <motion.p className="text-base text-muted md:text-lg" variants={enableMotion ? fadeInUp(0.08) : undefined}>
            Faça parte das nossas histórias! Junte-se à aventura.
          </motion.p>
          <motion.div variants={enableMotion ? fadeInUp(0.1) : undefined}>
            <Button
              as="a"
              className="w-[180px]"
              href="https://instagram.com/use.marima.ofc"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir Instagram Marima"
            >
              Siga-nos
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </motion.section>
  );
}

export default InstagramStrip;
