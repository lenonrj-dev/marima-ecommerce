"use client";

import { Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enableMotion = mounted && (motionSafe?.initial !== false);

  return (
    <motion.section
      {...(mounted ? motionSafe : {})}
      id="instagram"
      className="bg-body py-12 sm:py-16 lg:py-20 scroll-mt-20"
      variants={enableMotion ? staggerContainer(0.08) : undefined}
      initial={enableMotion ? "hidden" : false}
      whileInView={enableMotion ? "show" : undefined}
      viewport={enableMotion ? { once: true, amount: 0.25 } : undefined}
    >
      <Container className="space-y-12 sm:space-y-16">
        <motion.div className="flex justify-center" variants={slideInRight()}>
          <div className="relative hidden h-[560px] w-full max-w-[1100px] lg:block">
            <motion.div
              className="absolute left-[427px] top-[-30px] h-[120px] w-[120px] overflow-hidden"
              aria-hidden
              variants={imageReveal()}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765658296/DSC09945_elqjsl.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[565px] top-[-100px] h-[190px] w-[180px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.04)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765797846/3_rxq5g4.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[15%] top-[22%] h-[220px] w-[200px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.08)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765890414/WhatsApp_Image_2025-12-15_at_19.56.28_azoynj.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[35%] top-[18%] h-[340px] w-[360px] overflow-hidden"
              variants={imageReveal(0.1)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765890414/WhatsApp_Image_2025-12-15_at_19.56.28_3_br8kex.jpg"
                alt="Destaque central do Instagram"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[221px] h-[220px] w-[220px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.12)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765890414/WhatsApp_Image_2025-12-15_at_19.56.28_2_ynknrm.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[24%] flex h-14 w-14 items-center justify-center bg-[#111111] text-white"
              variants={fadeInUp(0.14)}
            >
              <Instagram className="h-6 w-6" strokeWidth={1.6} />
            </motion.div>

            <motion.div
              className="absolute left-[25%] top-[62%] h-[90px] w-[90px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.16)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765798030/SeriedeLancamento_zprs9t.png"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[70%] top-[82%] h-[140px] w-[150px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.18)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1765657502/GAB08620_uob24v.jpg"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.div
              className="absolute left-[645px] top-[82%] h-[100px] w-[100px] overflow-hidden"
              aria-hidden
              variants={imageReveal(0.2)}
            >
              <img
                src="https://res.cloudinary.com/dwf2uc6ot/image/upload/v1763943966/athleisu_qvmjw4.svg"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </motion.div>
          </div>

          <motion.div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:hidden"
            variants={slideInLeft()}
          >
            {["insta-1.jpg", "insta-2.jpg", "insta-3.jpg", "insta-4.jpg", "insta-5.jpg", "insta-6.jpg"].map(
              (image, idx) => (
                <motion.div key={image} className="overflow-hidden" variants={imageReveal(0.05 * idx)}>
                  <img
                    src={`/images/${image}`}
                    alt={`Destaque do Instagram ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    style={{ aspectRatio: "3 / 4" }}
                  />
                </motion.div>
              ),
            )}
          </motion.div>
        </motion.div>

        <motion.div className="max-w-2xl space-y-4" variants={slideInLeft(0.1)}>
          <motion.span className="text-[11px] uppercase tracking-[0.25em] text-muted" variants={textReveal()}>
            Instagram
          </motion.span>
          <motion.h3 className="font-serif text-3xl leading-tight text-[#111111] sm:text-4xl" variants={fadeInUp(0.06)}>
            Siga-nos <span className="italic text-primary">@use.marima.ofc</span>
          </motion.h3>
          <motion.p className="text-base text-muted md:text-lg" variants={fadeInUp(0.08)}>
            Faça parte das nossas histórias! Junte-se à aventura.
          </motion.p>
          <motion.div variants={fadeInUp(0.1)}>
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
